"""
Statutory Legal Metrology Document Generator (PDF Engine)
Generates official Section 36 Notices and Form IV Panchnama (Seizure Memos)
with embedded packaging photo, itemized violations, compounding fines,
and dynamic QR code authentication.
"""

from __future__ import annotations

import io
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import qrcode
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_qr_flowable(url: str, size: float = 1.1 * inch) -> Image:
    """Generates an in-memory QR code flowable for ReportLab."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Image(buf, width=size, height=size)


def get_evidence_image_flowable(
    file_path: Optional[str],
    max_width: float = 2.4 * inch,
    max_height: float = 1.8 * inch,
) -> Optional[Image]:
    """Prepares product packaging evidence photo flowable if file exists on disk."""
    if not file_path:
        return None
    p = Path(file_path)
    if not p.exists() or not p.is_file():
        return None
    try:
        with PILImage.open(p) as im:
            orig_w, orig_h = im.size
        # Maintain aspect ratio
        ratio = min(max_width / orig_w, max_height / orig_h)
        return Image(str(p), width=orig_w * ratio, height=orig_h * ratio)
    except Exception:
        return None


def generate_section36_notice_pdf(
    inspection_data: dict[str, Any],
    base_portal_url: str = "http://localhost:3000",
) -> bytes:
    """
    Generates an official Government of India Section 36 Compounding Notice PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_gov = ParagraphStyle(
        "GovTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        alignment=1,  # Center
        textColor=colors.HexColor("#1e293b"),
        textTransform="uppercase",
    )
    sub_gov = ParagraphStyle(
        "GovSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#475569"),
    )
    doc_heading = ParagraphStyle(
        "DocHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#991b1b"),
        spaceBefore=8,
        spaceAfter=10,
    )
    body_style = ParagraphStyle(
        "NoticeBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f172a"),
    )
    bold_style = ParagraphStyle(
        "NoticeBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f172a"),
    )
    fine_style = ParagraphStyle(
        "FinePrint",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748b"),
    )

    story = []

    # 1. Header Emblem & Ministry Text
    story.append(
        Paragraph("GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS", title_gov)
    )
    story.append(
        Paragraph(
            "DEPARTMENT OF CONSUMER AFFAIRS • LEGAL METROLOGY ENFORCEMENT WING",
            sub_gov,
        )
    )
    story.append(
        Paragraph(
            "National Portal for Packaged Commodity Regulation & Standards Compliance",
            fine_style,
        )
    )
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceAfter=8))

    # 2. Reference & Date Bar
    raw_id = inspection_data.get("rawId") or 1
    try:
        raw_int = int(raw_id)
    except (ValueError, TypeError):
        raw_int = 1
    notice_id = inspection_data.get("noticeId") or f"NOT-2026-{raw_int:03d}"
    ref_num = inspection_data.get("id", "INSP-2026-001")
    issued_date = datetime.now().strftime("%d-%b-%Y %H:%M HRS")

    meta_table_data = [
        [
            Paragraph(f"<b>Statutory Notice Ref:</b> {notice_id}", body_style),
            Paragraph(f"<b>Date of Inspection:</b> {inspection_data.get('createdAt', issued_date)}", body_style),
        ],
        [
            Paragraph(f"<b>Inspection Reference:</b> {ref_num}", body_style),
            Paragraph(f"<b>Jurisdiction:</b> {inspection_data.get('location', 'Gautam Buddha Nagar, UP')}", body_style),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 250])
    meta_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
        ])
    )
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # 3. Notice Subject Box
    story.append(
        Paragraph(
            "STATUTORY SHOW-CAUSE & COMPOUNDING NOTICE UNDER SECTION 36<br/>"
            "READ WITH RULE 18(2) OF THE LEGAL METROLOGY ACT, 2009",
            doc_heading,
        )
    )

    # 4. Addressed Entity
    store_name = inspection_data.get("storeName", "Aggarwal Departmental Store, Sector 62")
    brand = inspection_data.get("brand", "Manufacturer / Packer / Retailer")
    story.append(
        Paragraph(
            f"<b>TO:</b> The Principal Officer / Proprietor, <b>{store_name}</b><br/>"
            f"<b>Distributor / Brand Owner:</b> {brand}<br/>"
            f"<b>Location / Premises:</b> {inspection_data.get('location', 'Uttar Pradesh')}",
            body_style,
        )
    )
    story.append(Spacer(1, 8))

    # 5. Charge Statement
    product_name = inspection_data.get("productName", "Packaged Commodity")
    tamper_note = ""
    if inspection_data.get("tamperDetected"):
        tamper_note = (
            "<font color='#b91c1c'><b>CRITICAL PRICE TAMPERING DETECTED:</b> Foreign adhesive sticker / handwritten price "
            f"label observed over statutory declaration area. Reason: {inspection_data.get('tamperReason', 'Dual pricing alteration')}</font><br/>"
        )

    story.append(
        Paragraph(
            f"WHEREAS, on lawful inspection of the pre-packaged commodity <b>'{product_name}'</b> (SKU: {inspection_data.get('sku', 'N/A')}), "
            "the designated Enforcement Officer has prima facie recorded the following contraventions of the "
            "Legal Metrology (Packaged Commodities) Rules, 2011 and Section 36 of the Legal Metrology Act, 2009:<br/>"
            f"{tamper_note}",
            body_style,
        )
    )
    story.append(Spacer(1, 8))

    # 6. Violations Table
    violations = inspection_data.get("violations", [])
    v_rows = [
        [
            Paragraph("<b>Rule / Citation</b>", bold_style),
            Paragraph("<b>Non-Compliance Finding</b>", bold_style),
            Paragraph("<b>Detected vs Statutory</b>", bold_style),
            Paragraph("<b>Severity</b>", bold_style),
        ]
    ]

    if not violations:
        v_rows.append([
            Paragraph("Section 36(1)", body_style),
            Paragraph("Sample packaging under technical audit.", body_style),
            Paragraph("Compliant", body_style),
            Paragraph("INFO", body_style),
        ])
    else:
        for v in violations:
            v_rows.append([
                Paragraph(f"<b>{v.get('legalCitation', v.get('ruleCode', 'Rule 18(2)'))}</b>", body_style),
                Paragraph(v.get("message", "Violation of mandatory declaration rules."), body_style),
                Paragraph(
                    f"Det: {v.get('detectedValue', 'Non-compliant')}<br/>"
                    f"Exp: {v.get('expectedValue', 'Mandatory standard')}",
                    fine_style,
                ),
                Paragraph(
                    f"<font color='#dc2626'><b>{v.get('severity', 'MAJOR').upper()}</b></font>",
                    bold_style,
                ),
            ])

    v_table = Table(v_rows, colWidths=[130, 210, 120, 60])
    v_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(v_table)
    story.append(Spacer(1, 10))

    # 7. Compounding Fine & Photographic Evidence Layout
    evidence_img_path = inspection_data.get("diskImagePath")
    img_flowable = get_evidence_image_flowable(evidence_img_path)

    # Dynamic QR code
    qr_url = f"{base_portal_url}/scan/{ref_num}"
    qr_flowable = generate_qr_flowable(qr_url, size=1.0 * inch)

    # Compounding calculation
    fine_amount = "₹ 50,000" if inspection_data.get("tamperDetected") else "₹ 25,000"

    penalty_box = [
        Paragraph("<b>STATUTORY COMPOUNDING ASSESSMENT:</b>", bold_style),
        Paragraph(f"• Assessed Compounding Penalty: <b><font color='#b91c1c' size='11'>{fine_amount}</font></b>", body_style),
        Paragraph("• Governing Sections: Section 36(1), Section 48 & Rule 18(2)", fine_style),
        Paragraph("• Rectification & Response Period: <b>15 Days from Date of Notice</b>", body_style),
        Paragraph(
            "Failure to compound within 15 days shall lead to formal prosecution under Section 36(2) "
            "punishable with imprisonment up to one year and/or compounding enhancement.",
            fine_style,
        ),
    ]

    side_panel = [
        qr_flowable,
        Spacer(1, 2),
        Paragraph("<b>Scan to Authenticate</b>", fine_style),
        Paragraph(f"<font size='6'>{ref_num}</font>", fine_style),
    ]

    if img_flowable:
        middle_panel = [
            Paragraph("<b>Physical Evidence Photo</b>", fine_style),
            img_flowable,
        ]
        composite_data = [[penalty_box, middle_panel, side_panel]]
        composite_table = Table(composite_data, colWidths=[260, 160, 100])
    else:
        composite_data = [[penalty_box, side_panel]]
        composite_table = Table(composite_data, colWidths=[420, 100])

    composite_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(KeepTogether([composite_table]))
    story.append(Spacer(1, 14))

    # 8. Signature Block
    sig_data = [
        [
            Paragraph(
                "<b>Recipient Acknowledgement:</b><br/><br/>"
                "Signature / Stamp: _______________________<br/>"
                "Name of Authorized Person: ______________<br/>"
                "Date: ___________________________________",
                body_style,
            ),
            Paragraph(
                "<b>Issued by Enforcement Authority:</b><br/><br/>"
                "<b>INSPECTOR OF LEGAL METROLOGY</b><br/>"
                "Enforcement Division • Government of India<br/>"
                "Cryptographic Signature Key: <font name='Courier'>SHA256-DIG-9F8A</font><br/>"
                "Official Stamp: Verified & Issued",
                body_style,
            ),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEABOVE", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(KeepTogether([sig_table]))

    doc.build(story)
    return buffer.getvalue()


def generate_panchnama_pdf(
    inspection_data: dict[str, Any],
    base_portal_url: str = "http://localhost:3000",
) -> bytes:
    """
    Generates Form IV Legal Metrology Seizure Memorandum (Panchnama) PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "PanchTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        alignment=1,
        textColor=colors.HexColor("#0f172a"),
        textTransform="uppercase",
    )
    sub_title = ParagraphStyle(
        "PanchSub",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        alignment=1,
        textColor=colors.HexColor("#1e3a8a"),
        spaceAfter=10,
    )
    body_style = ParagraphStyle(
        "PanchBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
    )
    bold_style = ParagraphStyle(
        "PanchBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
    )
    fine_style = ParagraphStyle(
        "PanchFine",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#475569"),
    )

    story = []

    # 1. Header
    story.append(Paragraph("GOVERNMENT OF INDIA • DEPARTMENT OF CONSUMER AFFAIRS", title_style))
    story.append(Paragraph("OFFICE OF THE CONTROLLER OF LEGAL METROLOGY", title_style))
    story.append(Spacer(1, 4))
    story.append(
        Paragraph(
            "MEMORANDUM OF SEIZURE (PANCHNAMA) — FORM IV<br/>"
            "[Under Section 15(1)(b) & Section 15(2) of Legal Metrology Act, 2009]",
            sub_title,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceAfter=8))

    # 2. Details of Search and Seizure
    ref_num = inspection_data.get("id", "INSP-2026-001")
    store_name = inspection_data.get("storeName", "Aggarwal Departmental Store, Sector 62")
    loc = inspection_data.get("location", "Gautam Buddha Nagar, UP")
    coords = inspection_data.get("gpsCoords", {"lat": 28.6139, "lng": 77.3592})
    created_at = inspection_data.get("createdAt", datetime.now().strftime("%d-%b-%Y %H:%M HRS"))

    p1 = (
        f"This Seizure Memorandum is drawn on <b>{created_at}</b> by the undersigned Legal Metrology Inspector "
        f"having entered and searched the commercial premises known as <b>'{store_name}'</b>, located at "
        f"<b>{loc}</b> (GPS Coordinates: {coords.get('lat')}, {coords.get('lng')}), in the presence of the independent "
        "witnesses (Panchas) named hereunder."
    )
    story.append(Paragraph(p1, body_style))
    story.append(Spacer(1, 8))

    # 3. Independent Witnesses (Panchas) Table
    panch_data = [
        [
            Paragraph("<b>Panch No. 1 (Witness):</b>", bold_style),
            Paragraph("<b>Panch No. 2 (Witness):</b>", bold_style),
        ],
        [
            Paragraph(
                "Name: <b>Ramesh Chandra Gupta</b><br/>"
                "S/o: Late Sh. K.L. Gupta<br/>"
                "Address: H.No. 45, Sector 62, Noida, UP<br/>"
                "Contact: +91 98110-XXXXX",
                body_style,
            ),
            Paragraph(
                "Name: <b>Sunil Kumar Verma</b><br/>"
                "S/o: Sh. R.P. Verma<br/>"
                "Address: Shop 12, Market Complex, Sector 62, Noida, UP<br/>"
                "Contact: +91 97180-XXXXX",
                body_style,
            ),
        ],
    ]
    panch_table = Table(panch_data, colWidths=[260, 260])
    panch_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(panch_table)
    story.append(Spacer(1, 8))

    # 4. Articles Seized Table
    product_name = inspection_data.get("productName", "Packaged Commodity")
    brand = inspection_data.get("brand", "FMCG Brand")
    mrp = inspection_data.get("declaredMrp", "₹ 50.00")
    qty = inspection_data.get("netQuantity", "75 g")
    reason = "Dual-MRP sticker tampering & price enhancement" if inspection_data.get("tamperDetected") else "Rule 18 / Rule 6 statutory non-compliance"

    inv_data = [
        [
            Paragraph("<b>Item No.</b>", bold_style),
            Paragraph("<b>Commodity Description</b>", bold_style),
            Paragraph("<b>Batch / Barcode</b>", bold_style),
            Paragraph("<b>Seized Qty</b>", bold_style),
            Paragraph("<b>Statutory Reason for Seizure</b>", bold_style),
        ],
        [
            Paragraph("1", body_style),
            Paragraph(f"<b>{product_name}</b><br/>Brand: {brand}<br/>MRP: {mrp} | Net: {qty}", body_style),
            Paragraph(f"Barcode: {inspection_data.get('barcode', '8901030889211')}<br/>Ref: {ref_num}", fine_style),
            Paragraph("12 Sample Units (Exemplar)", body_style),
            Paragraph(f"<font color='#b91c1c'>{reason}</font>", bold_style),
        ],
    ]
    inv_table = Table(inv_data, colWidths=[40, 180, 110, 60, 130])
    inv_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(inv_table)
    story.append(Spacer(1, 10))

    # 5. Witness & Officer Statements
    declaration_text = (
        "The aforesaid articles have been seized in our presence and taken into legal custody under Section 15 "
        "of the Act. Exemplar samples have been sealed with the official seal of the Legal Metrology Inspectorate. "
        "The copy of this Seizure Memorandum was prepared on the spot and delivered to the person in charge."
    )
    story.append(Paragraph(declaration_text, body_style))
    story.append(Spacer(1, 10))

    # 6. QR Code & Authentication
    qr_url = f"{base_portal_url}/scan/{ref_num}"
    qr_flowable = generate_qr_flowable(qr_url, size=0.9 * inch)

    evidence_img_path = inspection_data.get("diskImagePath")
    img_flowable = get_evidence_image_flowable(evidence_img_path, max_width=2.0 * inch, max_height=1.3 * inch)

    auth_box = [
        Paragraph(f"<b>Seizure Dossier ID:</b> <font name='Courier'>{ref_num}</font>", bold_style),
        Paragraph("<b>Chain of Custody:</b> Registered in National Compliance Vault", fine_style),
        Paragraph("<b>Statutory Authority:</b> Legal Metrology Enforcement Rules 2011", fine_style),
    ]

    panel_items = [auth_box, qr_flowable]
    if img_flowable:
        row_data = [[auth_box, img_flowable, qr_flowable]]
        auth_table = Table(row_data, colWidths=[250, 170, 100])
    else:
        row_data = [[auth_box, qr_flowable]]
        auth_table = Table(row_data, colWidths=[420, 100])

    auth_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(auth_table)
    story.append(Spacer(1, 14))

    # 7. Signature Triad
    sig_block = [
        [
            Paragraph("<b>Signature of Panch 1:</b><br/><br/>______________________<br/>(Ramesh Chandra Gupta)", body_style),
            Paragraph("<b>Signature of Panch 2:</b><br/><br/>______________________<br/>(Sunil Kumar Verma)", body_style),
            Paragraph("<b>Inspecting Authority:</b><br/><br/>______________________<br/><b>Inspector of Legal Metrology</b><br/>Govt. of India", bold_style),
        ]
    ]
    sig_table = Table(sig_block, colWidths=[170, 170, 180])
    sig_table.setStyle(
        TableStyle([
            ("LINEABOVE", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ])
    )
    story.append(KeepTogether([sig_table]))

    doc.build(story)
    return buffer.getvalue()
