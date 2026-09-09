from pathlib import Path
import hashlib

from app.db.session import SessionLocal
from app.models import InspectionImage


INSPECTION_ID = 1


def sha256(path: str) -> str:
    h = hashlib.sha256()

    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)

    return h.hexdigest()


db = SessionLocal()

try:
    images = (
        db.query(InspectionImage)
        .filter(InspectionImage.inspection_id == INSPECTION_ID)
        .order_by(InspectionImage.id.asc())
        .all()
    )

    seen = {}

    print("\n" + "=" * 75)
    print("LABELGUARD — DUPLICATE IMAGE CLEANUP DRY RUN")
    print("=" * 75)

    for image in images:
        path = Path(image.file_path)

        if not path.exists():
            print(
                f"ID={image.id} | FILE MISSING | {image.file_path}"
            )
            continue

        file_hash = sha256(str(path))

        print(
            f"ID={image.id} | TYPE={image.image_type} "
            f"| FILE={image.file_name} | HASH={file_hash[:16]}..."
        )

        if file_hash in seen:
            keeper = seen[file_hash]

            print(
                f"  -> DUPLICATE OF ID={keeper.id} "
                f"(KEEP ID={keeper.id})"
            )
        else:
            seen[file_hash] = image
            print("  -> KEEP")

    print("\n" + "-" * 75)
    print("KEEP RECORDS:")

    for image in seen.values():
        print(
            f"KEEP ID={image.id} | TYPE={image.image_type} "
            f"| FILE={image.file_name}"
        )

    print("\nDUPLICATE RECORDS TO REMOVE:")

    duplicate_count = 0

    for image in images:
        path = Path(image.file_path)

        if not path.exists():
            continue

        file_hash = sha256(str(path))

        if seen[file_hash].id != image.id:
            duplicate_count += 1
            print(
                f"REMOVE ID={image.id} | TYPE={image.image_type} "
                f"| FILE={path.name}"
            )

    print(f"\nDUPLICATES FOUND: {duplicate_count}")

finally:
    db.close()
