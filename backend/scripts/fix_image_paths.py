from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import InspectionImage


PROJECT_ROOT = Path.cwd()
NEW_ROOT = PROJECT_ROOT / "storage" / "uploads"


def fix_paths():
    NEW_ROOT.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()

    try:
        rows = db.scalars(
            select(InspectionImage).order_by(InspectionImage.id)
        ).all()

        updated = 0
        missing = 0

        for row in rows:
            old_path = Path(row.file_path)
            file_name = old_path.name
            new_path = NEW_ROOT / file_name

            if new_path.exists():
                if str(old_path) != str(new_path):
                    row.file_path = str(new_path)
                    updated += 1
            else:
                missing += 1
                print(
                    f"MISSING FILE: id={row.id}, "
                    f"expected={new_path}"
                )

        db.commit()

        print(f"UPDATED DB RECORDS: {updated}")
        print(f"MISSING FILES: {missing}")

        for row in rows:
            print(
                f"{row.id} | "
                f"{row.file_name} | "
                f"{row.file_path}"
            )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    fix_paths()
