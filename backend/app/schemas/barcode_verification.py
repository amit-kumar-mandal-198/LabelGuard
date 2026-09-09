from pydantic import BaseModel, Field


class BarcodeVerificationRequest(BaseModel):
    ocr_manufacturer: str | None = Field(
        default=None,
        max_length=255,
    )

    ocr_address: str | None = Field(
        default=None,
        max_length=2000,
    )
