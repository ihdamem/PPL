from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.models import AuditLog, AuditAction, BookingStatus, User, Role
from app.auth import require_user

router = APIRouter(prefix="/audit", tags=["audit"])

# In-memory audit trail, mirrors fake_bookings_db in booking.py
fake_audit_logs: List[AuditLog] = []
audit_id_counter = 1


def record_audit(
    booking_id: int,
    actor: User,
    action: AuditAction,
    old_status: Optional[BookingStatus],
    new_status: BookingStatus,
) -> AuditLog:
    global audit_id_counter
    entry = AuditLog(
        id=audit_id_counter,
        booking_id=booking_id,
        actor_id=actor.sub,
        actor_name=actor.name or actor.email,
        action=action,
        old_status=old_status,
        new_status=new_status,
        created_at=datetime.now(),
    )
    fake_audit_logs.append(entry)
    audit_id_counter += 1
    return entry


def _require_staff(current_user: User) -> None:
    if current_user.role not in [Role.ADMIN, Role.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya admin yang dapat mengakses audit log",
        )


@router.get("", response_model=List[AuditLog])
async def get_audit_logs(current_user: User = Depends(require_user)):
    """Riwayat aktivitas seluruh booking. Hanya untuk approver/admin."""
    _require_staff(current_user)
    return sorted(fake_audit_logs, key=lambda log: log.created_at, reverse=True)


@router.get("/booking/{booking_id}", response_model=List[AuditLog])
async def get_booking_audit_logs(booking_id: int, current_user: User = Depends(require_user)):
    """Riwayat aktivitas untuk satu booking tertentu. Hanya untuk approver/admin."""
    _require_staff(current_user)
    logs = [log for log in fake_audit_logs if log.booking_id == booking_id]
    return sorted(logs, key=lambda log: log.created_at)
