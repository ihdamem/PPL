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

    # Profile fields
    nomor_induk: Optional[str] = None
    departemen: Optional[str] = None
    created_at: Optional[datetime] = None

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


class AuditAction(str, Enum):
    CREATE = "create"
    APPROVE = "approve"
    REJECT = "reject"


class AuditLog(BaseModel):
    id: int
    booking_id: int
    actor_id: str
    actor_name: Optional[str] = None
    action: AuditAction
    old_status: Optional[BookingStatus] = None
    new_status: BookingStatus
    created_at: datetime


class Notification(BaseModel):
    id: int
    booking_id: int
    message: str
    read: bool = False
    created_at: datetime
    user_id: Optional[str] = None
    target_role: Optional[Role] = None
