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

    seen: dict[str, InspectionImage] = {}
    duplicates: list[InspectionImage] = []

    for image in images:
        path = Path(image.file_path)

        if not path.exists():
            continue

        file_hash = sha256(str(path))

        if file_hash in seen:
            duplicates.append(image)
        else:
            seen[file_hash] = image

    if not duplicates:
        print("No duplicates found.")
        db.close()
        raise SystemExit(0)

    print("\n" + "=" * 75)
    print("LABELGUARD — DUPLICATE IMAGE CLEANUP")
    print("=" * 75)

    for image in duplicates:
        print(
            f"REMOVING ID={image.id} | "
            f"TYPE={image.image_type} | "
            f"FILE={Path(image.file_path).name}"
        )

    # Remove duplicate DB rows first.
    for image in duplicates:
        db.delete(image)

    db.commit()

    # Remove duplicate physical files only after DB commit.
    for image in duplicates:
        path = Path(image.file_path)

        if path.exists():
            path.unlink()

    print("\nCleanup completed.")
    print("Kept image IDs:", [image.id for image in seen.values()])
    print("Removed image IDs:", [image.id for image in duplicates])

finally:
    db.close()
