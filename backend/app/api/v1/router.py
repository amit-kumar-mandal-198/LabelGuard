from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    health,
    images,
    inspections,
    products,
    barcodes,
    manufacturer_references,
    analysis,
    compliance,
    analytics,
)


api_router = APIRouter()


api_router.include_router(
    health.router,
    tags=["Health"],
)

api_router.include_router(
    auth.router,
)

api_router.include_router(
    inspections.router,
)

api_router.include_router(
    images.router,
)

api_router.include_router(
    products.router,
)

api_router.include_router(
    barcodes.router,
)

api_router.include_router(
    manufacturer_references.router,
)

api_router.include_router(
    analysis.router,
)

api_router.include_router(
    compliance.router,
)

api_router.include_router(
    compliance.compliance_router,
)

api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"],
)
