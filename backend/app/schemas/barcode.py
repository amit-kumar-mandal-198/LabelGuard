from pydantic import BaseModel, ConfigDict, Field


class BarcodeCreate(BaseModel):
    product_id: int = Field(gt=0)
    barcode_value: str = Field(min_length=4, max_length=32)
    barcode_type: str | None = Field(default=None, max_length=32)
    source_type: str | None = Field(default=None, max_length=50)
    source_reference: str | None = Field(default=None, max_length=255)


class BarcodeResponse(BarcodeCreate):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class BarcodeProductResponse(BaseModel):
    barcode_value: str
    barcode_type: str | None
    product_id: int
    brand_name: str | None
    product_name: str | None
    category: str | None
    package_type: str | None
    manufacturer_name: str | None
    manufacturer_address: str | None

    model_config = ConfigDict(
        from_attributes=True,
    )
