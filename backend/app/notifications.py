from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.models import Notification, Role, User
from app.auth import require_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

# In-memory notification store, mirrors fake_bookings_db in booking.py
fake_notifications: List[Notification] = []
notification_id_counter = 1


def _visible_to(notification: Notification, user: User) -> bool:
    if notification.user_id is not None:
        return notification.user_id == user.sub
    if notification.target_role is not None:
        return notification.target_role == user.role
    return False


def notify_user(user_id: str, booking_id: int, message: str) -> Notification:
    return _create(booking_id=booking_id, message=message, user_id=user_id)


def notify_role(role: Role, booking_id: int, message: str) -> Notification:
    return _create(booking_id=booking_id, message=message, target_role=role)


def _create(
    booking_id: int,
    message: str,
    user_id: Optional[str] = None,
    target_role: Optional[Role] = None,
) -> Notification:
    global notification_id_counter
    notif = Notification(
        id=notification_id_counter,
        booking_id=booking_id,
        message=message,
        user_id=user_id,
        target_role=target_role,
        created_at=datetime.now(),
    )
    fake_notifications.append(notif)
    notification_id_counter += 1
    return notif


@router.get("", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(require_user)):
    """Notifikasi milik user ini, termasuk broadcast untuk role-nya (mis. semua approver)."""
    visible = [n for n in fake_notifications if _visible_to(n, current_user)]
    return sorted(visible, key=lambda n: n.created_at, reverse=True)


@router.patch("/{notification_id}/read", response_model=Notification)
async def mark_notification_read(notification_id: int, current_user: User = Depends(require_user)):
    notif = next((n for n in fake_notifications if n.id == notification_id), None)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notifikasi tidak ditemukan")
    if not _visible_to(notif, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Akses ditolak")
    notif.read = True
    return notif


@router.post("/read-all")
async def mark_all_read(current_user: User = Depends(require_user)):
    count = 0
    for n in fake_notifications:
        if _visible_to(n, current_user) and not n.read:
            n.read = True
            count += 1
    return {"marked_read": count}
