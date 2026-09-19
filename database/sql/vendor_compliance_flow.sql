START
  │
  ▼
┌─────────────────────┐
│ Register on Portal  │──► Verify Email/Mobile (OTP) ──► Company Profile Setup
│ (Manufacturer/Packer│                                    (GST, LUT No., Address)
│  /Importer/Seller)  │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ LOGIN (JWT issued)  │
└─────────┬───────────┘
          ▼
┌─────────────────────────────────────┐
│ CHOOSE ACTION:                      │
│  A) Self-Audit New Product Label    │
│  B) View My Compliance History      │
│  C) Download My Reports             │
│  D) Fix & Resubmit Violation        │
└──────┬──────────┬─────────┬─────────┘
       │A         │B/C      │D
       ▼          ▼         │
┌──────────────────┐ ┌──────────────────┐
│ Upload label     │ │ View dashboard:  │
│ image/artwork    │ │ - Compliance %   │
│ (JPG/PNG/PDF)    │ │ - Past violations│
└───────┬──────────┘ │ - Report history │
        ▼            └──────────────────┘
┌──────────────────┐
│ System processes │
│ (OCR→Extract→    │
│ Rule Check)      │
└───────┬──────────┘
        ▼
┌─────────────────────────────┐
│ RESULT SCREEN:              │
│ ✅ Compliant → Certificate  │
│ ❌ Violations shown with:   │
│  • Exact rule citation      │
│  • Annotated image (red box)│
│  • Fix suggestion           │
└───────┬─────────────────────┘
        ▼ (if violation)
┌──────────────────┐
│ Vendor corrects  │──► Resubmit (loop back to upload)
│ label artwork    │
└──────────────────┘
