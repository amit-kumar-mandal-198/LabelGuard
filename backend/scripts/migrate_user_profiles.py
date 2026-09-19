import sqlite3
from pathlib import Path

def migrate_users_table():
    db_path = Path(__file__).resolve().parent.parent.parent / "database" / "labelguard.db"
    if not db_path.exists():
        print("Database not found at:", db_path)
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    existing_cols = {col[1] for col in cur.execute("PRAGMA table_info(users)").fetchall()}
    print("Existing columns in users table:", existing_cols)

    new_cols = {
        "designation": "VARCHAR(120)",
        "department": "VARCHAR(120)",
        "district": "VARCHAR(120)",
        "state": "VARCHAR(120)",
        "company_name": "VARCHAR(255)",
        "gst_number": "VARCHAR(30)",
        "lut_number": "VARCHAR(60)",
        "badge_number": "VARCHAR(60)",
        "entity_category": "VARCHAR(120)",
        "address": "VARCHAR(500)",
        "organization": "VARCHAR(255)",
    }

    for col_name, col_type in new_cols.items():
        if col_name not in existing_cols:
            print(f"Adding column {col_name} ({col_type}) to users...")
            cur.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")

    conn.commit()
    conn.close()
    print("User profile columns migration completed successfully!")

if __name__ == "__main__":
    migrate_users_table()
