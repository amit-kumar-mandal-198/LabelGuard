from pydantic import BaseModel, ConfigDict, Field


class ManufacturerReferenceCreate(BaseModel):
    manufacturer_name: str = Field(
        min_length=2,
        max_length=255,
    )

    manufacturer_address: str = Field(
        min_length=5,
    )

    source_type: str = Field(
        min_length=2,
        max_length=50,
    )

    source_reference: str | None = Field(
        default=None,
        max_length=500,
    )

    product_id: int | None = Field(
        default=None,
        gt=0,
    )


class ManufacturerReferenceResponse(
    ManufacturerReferenceCreate
):
    id: int
    verified_at: object | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )
