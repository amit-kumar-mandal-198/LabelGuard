from sqlalchemy import text

from app.db.session import engine


with engine.connect() as conn:
    rows = conn.execute(
        text(
            """
            SELECT
                id,
                price_status,
                decision,
                encode(
                    evidence::text::bytea,
                    'hex'
                ) AS evidence_hex
            FROM mrp_findings
            ORDER BY id
            """
        )
    ).mappings().all()

    for row in rows:
        print("=" * 80)
        print("ID       :", row["id"])
        print("PRICE    :", row["price_status"])
        print("DECISION :", row["decision"])
        print("EVIDENCE :", row["evidence_hex"])
