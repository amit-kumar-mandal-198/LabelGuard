from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    designation: str | None = None
    department: str | None = None
    district: str | None = None
    state: str | None = None
    company_name: str | None = None
    gst_number: str | None = None


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    role: str = Field(default="vendor")
    designation: str | None = None
    department: str | None = None
    district: str | None = None
    state: str | None = None
    company_name: str | None = None
    gst_number: str | None = None


class AuthSuccessResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CurrentUserResponse
