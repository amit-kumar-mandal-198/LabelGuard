from sqlalchemy import text

from app.db.session import engine


with engine.connect() as conn:
    for query in (
        "SHOW server_encoding",
        "SHOW client_encoding",
    ):
        value = conn.execute(text(query)).scalar_one()
        print(f"{query}: {value}")
