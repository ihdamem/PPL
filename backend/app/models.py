from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date, time
from enum import Enum


class Role(str, Enum):
    USER = "user"
    ADMIN = "admin"
    APPROVER = "approver"


class User(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None
    sub: str
    role: Role = Role.USER


class BookingStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class BookingCreate(BaseModel):
    room_id: int
    tanggal: date
    waktu_mulai: time
    waktu_selesai: time
    keperluan: str = Field(..., min_length=5)
    jumlah_peserta: int = Field(..., gt=0)
    surat_url: Optional[str] = None


class BookingResponse(BookingCreate):
    id: int
    user_id: str
    status: BookingStatus
    created_at: datetime

    class Config:
        from_attributes = True


class LoginUrlResponse(BaseModel):
    url: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
