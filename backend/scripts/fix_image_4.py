from sqlalchemy import update

from app.db.session import SessionLocal
from app.models import InspectionImage


OLD_PATH = r"C:\Users\Lenovo\LABELGUARD\backend\app\storage\uploads\e06a38b554e1456d81a4e262f6201f4e.png"
NEW_PATH = r"C:\Users\Lenovo\LABELGUARD\backend\storage\uploads\e06a38b554e1456d81a4e262f6201f4e.png"


db = SessionLocal()

try:
    result = db.execute(
        update(InspectionImage)
        .where(InspectionImage.id == 4)
        .values(file_path=NEW_PATH)
    )

    db.commit()

    print("UPDATED ROWS:", result.rowcount)

finally:
    db.close()
