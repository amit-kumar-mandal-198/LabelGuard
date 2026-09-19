from sqlalchemy import text

from app.db.session import engine


with engine.connect() as conn:
    print(
        "CLIENT ENCODING:",
        conn.execute(
            text("SHOW client_encoding")
        ).scalar_one(),
    )
