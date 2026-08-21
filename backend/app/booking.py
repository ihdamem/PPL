from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models import BookingCreate, BookingResponse, BookingStatus, AuditAction, User, Role
from app.auth import require_user
from app.audit import record_audit
from app.notifications import notify_user, notify_role

router = APIRouter(prefix="/bookings", tags=["bookings"])

# In-memory database for demonstration purposes
# In a real app, this would be a real database (e.g., PostgreSQL)
fake_bookings_db = []
booking_id_counter = 1


class ApprovalRequest(BaseModel):
    action: str  # "approve" or "reject"
    alasan_penolakan: Optional[str] = None


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingCreate, current_user: User = Depends(require_user)):
    global booking_id_counter

    # Server-side validation: Check if end time is after start time
    if booking.waktu_selesai <= booking.waktu_mulai:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Waktu selesai harus setelah waktu mulai"
        )

    # Create new booking with PENDING status
    new_booking = BookingResponse(
        id=booking_id_counter,
        user_id=current_user.sub,
        status=BookingStatus.PENDING,
        created_at=datetime.now(),
        **booking.model_dump()
    )

    fake_bookings_db.append(new_booking)
    booking_id_counter += 1

    record_audit(
        booking_id=new_booking.id,
        actor=current_user,
        action=AuditAction.CREATE,
        old_status=None,
        new_status=new_booking.status,
    )
    pemohon = current_user.name or current_user.email
    for role in (Role.ADMIN, Role.SUPERADMIN):
        notify_role(
            role,
            booking_id=new_booking.id,
            message=f"Pengajuan baru dari {pemohon}: {new_booking.keperluan}",
        )

    return new_booking


@router.get("", response_model=List[BookingResponse])
async def get_bookings(current_user: User = Depends(require_user)):
    # If admin or approver, return all bookings
    if current_user.role in [Role.ADMIN, Role.SUPERADMIN]:
        return fake_bookings_db

    # If regular user, return only their bookings
    user_bookings = [b for b in fake_bookings_db if b.user_id == current_user.sub]
    return user_bookings


@router.get("/pending", response_model=List[BookingResponse])
async def get_pending_bookings(current_user: User = Depends(require_user)):
    """Hanya approver/admin yang bisa melihat semua booking pending."""
    if current_user.role not in [Role.ADMIN, Role.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya admin yang dapat mengakses halaman ini"
        )
    pending = [b for b in fake_bookings_db if b.status == BookingStatus.PENDING]
    return pending


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_detail(booking_id: int, current_user: User = Depends(require_user)):
    """Lihat detail satu booking."""
    booking = next((b for b in fake_bookings_db if b.id == booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    # User biasa hanya bisa lihat booking miliknya sendiri
    if current_user.role == Role.BOOKER and booking.user_id != current_user.sub:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    return booking


@router.patch("/{booking_id}/approval", response_model=BookingResponse)
async def approve_or_reject_booking(
    booking_id: int,
    payload: ApprovalRequest,
    current_user: User = Depends(require_user)
):
    """Approver/admin bisa approve atau reject booking."""
    if current_user.role not in [Role.ADMIN, Role.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya admin yang dapat melakukan approval"
        )

    booking = next((b for b in fake_bookings_db if b.id == booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Booking sudah diproses dengan status: {booking.status}"
        )

    old_status = booking.status

    if payload.action == "approve":
        booking.status = BookingStatus.APPROVED
        record_audit(
            booking_id=booking.id,
            actor=current_user,
            action=AuditAction.APPROVE,
            old_status=old_status,
            new_status=booking.status,
        )
        notify_user(
            booking.user_id,
            booking_id=booking.id,
            message=f"Booking \"{booking.keperluan}\" telah disetujui.",
        )
    elif payload.action == "reject":
        if not payload.alasan_penolakan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Alasan penolakan harus diisi"
            )
        booking.status = BookingStatus.REJECTED
        record_audit(
            booking_id=booking.id,
            actor=current_user,
            action=AuditAction.REJECT,
            old_status=old_status,
            new_status=booking.status,
        )
        notify_user(
            booking.user_id,
            booking_id=booking.id,
            message=f"Booking \"{booking.keperluan}\" ditolak: {payload.alasan_penolakan}",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Aksi tidak valid, gunakan 'approve' atau 'reject'"
        )

    return booking
