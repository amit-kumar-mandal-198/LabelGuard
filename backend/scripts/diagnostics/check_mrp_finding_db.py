from sqlalchemy import text

from app.db.session import engine


with engine.connect() as conn:
    row = conn.execute(
        text(
            """
            SELECT
                id,
                price_status,
                declared_mrp,
                reference_mrp,
                tamper_status,
                tamper_risk_score,
                decision,
                reason,
                evidence::text AS evidence_text
            FROM mrp_findings
            WHERE id = 1
            """
        )
    ).mappings().one()

    print("=" * 80)
    print("MRP FINDING DB CHECK")
    print("=" * 80)

    print("ID              :", row["id"])
    print("DECLARED MRP    :", row["declared_mrp"])
    print("REFERENCE MRP   :", row["reference_mrp"])
    print("PRICE STATUS    :", row["price_status"])
    print("TAMPER STATUS   :", row["tamper_status"])
    print("TAMPER RISK     :", row["tamper_risk_score"])
    print("DECISION        :", row["decision"])
    print("REASON          :", row["reason"])

    evidence = row["evidence_text"] or ""

    print("EVIDENCE LENGTH :", len(evidence))
    print("EVIDENCE START  :", evidence[:500])
