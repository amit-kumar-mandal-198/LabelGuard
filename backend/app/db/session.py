from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


from pathlib import Path

connect_args = {}
db_url = settings.database_url

if "postgresql" in db_url:
    connect_args = {"options": "-c client_encoding=UTF8"}
elif "sqlite" in db_url:
    connect_args = {"check_same_thread": False}
    # Resilient resolution for relative SQLite paths
    if db_url.startswith("sqlite:///") and not db_url.startswith("sqlite:////"):
        raw_path = db_url.replace("sqlite:///", "")
        path_obj = Path(raw_path)
        if not path_obj.is_absolute() and not path_obj.exists():
            # Check relative to backend directory or workspace root
            backend_root = Path(__file__).resolve().parent.parent.parent
            workspace_root = backend_root.parent
            candidates = [
                backend_root / raw_path,
                workspace_root / raw_path,
                workspace_root / "database" / path_obj.name,
                backend_root / "database" / path_obj.name,
            ]
            for candidate in candidates:
                if candidate.exists():
                    db_url = f"sqlite:///{candidate.resolve()}"
                    break

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
