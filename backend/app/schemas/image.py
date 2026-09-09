from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ImageResponse(BaseModel):
    id: int
    inspection_id: int
    file_name: str
    file_path: str
    image_type: str | None
    file_size: int | None
    mime_type: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
