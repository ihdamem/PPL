from pydantic import BaseModel, EmailStr
from typing import Optional


class User(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None
    sub: str


class LoginUrlResponse(BaseModel):
    url: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
