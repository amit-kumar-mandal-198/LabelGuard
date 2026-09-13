from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "AI-Assisted Legal Metrology Compliance "
        "and Inspection Platform"
    ),
)


cors_origins_list = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]
is_wildcard_cors = "*" in cors_origins_list

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard_cors else cors_origins_list,
    allow_credentials=not is_wildcard_cors,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "LABELGUARD Backend is running",
        "version": "0.1.0",
    }


from pathlib import Path
from fastapi.staticfiles import StaticFiles

storage_path = Path(__file__).resolve().parent.parent / "storage"
storage_path.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(storage_path)), name="storage")

app.include_router(
    api_router,
    prefix=settings.api_v1_prefix,
)
