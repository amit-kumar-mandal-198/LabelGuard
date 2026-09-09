from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    brand_name: str | None = Field(default=None, max_length=150)
    product_name: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    package_type: str | None = Field(default=None, max_length=100)
    manufacturer_name: str | None = Field(default=None, max_length=255)
    manufacturer_address: str | None = None


class ProductResponse(ProductCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ProductMRPReferenceCreate(BaseModel):
    pack_quantity: float | None = Field(default=None, gt=0)
    pack_unit: str | None = Field(default=None, max_length=30)
    variant: str | None = Field(default=None, max_length=150)

    reference_mrp: float = Field(gt=0)

    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=10,
    )

    source_type: str = Field(
        min_length=1,
        max_length=50,
    )

    source_reference: str | None = None

    effective_from: str | None = None
    effective_to: str | None = None

    version: str = Field(
        default="1.0",
        max_length=50,
    )


class ProductMRPReferenceResponse(ProductMRPReferenceCreate):
    id: int
    product_id: int

    model_config = ConfigDict(from_attributes=True)
