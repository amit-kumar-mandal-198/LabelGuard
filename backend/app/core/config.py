from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LABELGUARD"
    environment: str = "development"
    debug: bool = True

    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "*"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/labelguard"

    jwt_secret_key: str = "labelguard-super-secret-jwt-key-2026"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    gemini_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
