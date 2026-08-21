from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date, time
from enum import Enum


class Role(str, Enum):
    BOOKER = "booker"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


# Map nilai role lama (sebelum refactor) ke role baru.
LEGACY_ROLE_MAP = {
    "user": Role.BOOKER,
    "approver": Role.ADMIN,
}


class User(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None
    sub: str
    role: Role = Role.BOOKER

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
    room_name: Optional[str] = None

    class Config:
        from_attributes = True


class RoomStatus(str, Enum):
    AVAILABLE = "available"
    MAINTENANCE = "maintenance"


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    location: str = Field(..., min_length=3, max_length=150)
    capacity: int = Field(..., gt=0)
    facilities: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    status: RoomStatus = RoomStatus.AVAILABLE


class RoomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    location: Optional[str] = Field(None, min_length=3, max_length=150)
    capacity: Optional[int] = Field(None, gt=0)
    facilities: Optional[List[str]] = None
    description: Optional[str] = None
    status: Optional[RoomStatus] = None


class RoomResponse(RoomCreate):
    id: int
    created_at: datetime


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
