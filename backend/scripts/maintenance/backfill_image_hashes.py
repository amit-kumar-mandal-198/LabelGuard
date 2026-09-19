import hashlib
from pathlib import Path

from app.db.session import SessionLocal
from app.models import InspectionImage


db = SessionLocal()

try:
    images = (
        db.query(InspectionImage)
        .order_by(InspectionImage.id.asc())
        .all()
    )

    print("\n" + "=" * 75)
    print("LABELGUARD — IMAGE HASH BACKFILL")
    print("=" * 75)

    updated = 0

    for image in images:
        path = Path(image.file_path)

        if not path.exists():
            print(
                f"ERROR | ID={image.id} | "
                f"File missing: {image.file_path}"
            )
            continue

        hasher = hashlib.sha256()

        with path.open("rb") as file:
            for chunk in iter(
                lambda: file.read(1024 * 1024),
                b"",
            ):
                hasher.update(chunk)

        image.content_hash = hasher.hexdigest()

        print(
            f"ID={image.id} | "
            f"HASH={image.content_hash}"
        )

        updated += 1

    db.commit()

    print("\nUPDATED:", updated)

finally:
    db.close()
