# LABELGUARD

**AI-Powered Packaged Commodity Compliance & Legal Metrology Inspection System**

LABELGUARD is an automated inspection platform designed to verify packaged commodity labeling against the **Legal Metrology (Packaged Commodities) Rules, 2011** and relevant regulatory standards (FSSAI, Consumer Protection).

---

## Key Features

- **Automated Declaration Extraction**: Extracts mandatory packaging declarations using computer vision and OCR:
  - Maximum Retail Price (MRP) & Unit Sale Price
  - Net Quantity
  - Date of Manufacture / Packing / Import
  - Best Before / Expiry Date
  - Manufacturer & Packer Identification
  - Consumer Care Contact Information
  - Country of Origin
  - Commodity Name
  - Batch / Lot Number
- **Rule Engine & Compliance Verification**: Evaluates compliance across all Legal Metrology standards:
  - `LG-MRP`: Maximum Retail Price presence and format
  - `LG-QTY`: Net quantity declaration with metric units
  - `LG-DATE`: Manufacturing / packaging date verification
  - `LG-BBE`: Best-before / expiry for date-sensitive commodities
  - `LG-MFR`: Manufacturer name and complete address verification
  - `LG-CARE`: Consumer care telephone, email, and contact details
  - `LG-COO`: Country of origin verification (domestic declaration & mandatory import compliance)
  - `LG-COMMODITY`: Generic commodity or brand name identification
  - `LG-LEGIBILITY`: Declaration legibility and prominence scoring
- **Tamper & Anomaly Detection**: Identifies dual-pricing, price scratching, and altered packaging declarations.
- **RESTful API & Modern Web Dashboard**: Built with FastAPI (Backend) and Next.js / TypeScript (Frontend).

---

## Project Structure

```text
LABELGUARD/
├── backend/                  # FastAPI Backend & AI Pipeline
│   ├── app/
│   │   ├── ai/               # OCR, orientation detection, & extraction
│   │   ├── api/v1/           # REST endpoints
│   │   ├── core/             # Configuration & security
│   │   ├── db/               # Database engine & session
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── repositories/     # Database access layer
│   │   ├── rules/            # Compliance rules & validators
│   │   ├── schemas/          # Pydantic models
│   │   ├── seed/             # Legal Metrology rules seed data
│   │   └── services/         # Compliance, analysis, & extraction services
│   ├── migrations/           # Alembic database migrations
│   └── tests/                # Unit and integration tests
├── frontend/                 # Next.js / React Frontend Dashboard
│   ├── src/app/              # Next.js App Router pages
│   └── public/               # Static assets
├── docs/                     # Architecture & API documentation
│   ├── api/                  # API contracts
│   ├── architecture/         # System & pipeline architecture
│   └── rules/                # Legal Metrology rule matrix
└── samples/                  # Sample test packaging images
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL 14+
- Tesseract OCR (with English language pack)

### Backend Setup

1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate    # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   # Update DATABASE_URL and JWT_SECRET_KEY in .env
   ```
5. Apply database migrations & seed rules:
   ```bash
   alembic upgrade head
   python -m app.scripts.seed_database
   ```
6. Start the API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the web dashboard at `http://localhost:3000`.

---

## License

Proprietary / All Rights Reserved.
