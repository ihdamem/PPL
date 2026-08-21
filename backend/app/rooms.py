from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional

from app.auth import require_user
from app.models import Role, RoomCreate, RoomResponse, RoomStatus, RoomUpdate, User
from app.rooms_db import create_room, delete_room, get_room, list_rooms, update_room

router = APIRouter(prefix="/rooms", tags=["rooms"])


def require_staff(current_user: User = Depends(require_user)) -> User:
    """Guard: hanya admin/superadmin yang boleh mengelola ruangan."""

    if current_user.role not in (Role.ADMIN, Role.SUPERADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya admin yang dapat mengelola ruangan",
        )
    return current_user


@router.get("", response_model=List[RoomResponse])
async def get_rooms(
    status_filter: Optional[RoomStatus] = Query(None, alias="status"),
    current_user: User = Depends(require_user),
):
    """Daftar semua ruangan. Bisa difilter berdasarkan status."""

    return list_rooms(status=status_filter)


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room_detail(room_id: int, current_user: User = Depends(require_user)):
    room = get_room(room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruangan tidak ditemukan",
        )
    return room


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def add_room(
    payload: RoomCreate,
    current_user: User = Depends(require_staff),
):
    """Tambah ruangan baru. Khusus admin/superadmin."""

    if any(r.name.lower() == payload.name.strip().lower() for r in list_rooms()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ruangan dengan nama '{payload.name}' sudah ada",
        )

    return create_room(payload)


@router.patch("/{room_id}", response_model=RoomResponse)
async def edit_room(
    room_id: int,
    payload: RoomUpdate,
    current_user: User = Depends(require_staff),
):
    """Ubah data ruangan. Khusus admin/superadmin."""

    if payload.name is not None:
        normalized = payload.name.strip().lower()
        if any(
            r.name.lower() == normalized and r.id != room_id for r in list_rooms()
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ruangan dengan nama '{payload.name}' sudah ada",
            )

    room = update_room(room_id, payload)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruangan tidak ditemukan",
        )
    return room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_room(room_id: int, current_user: User = Depends(require_staff)):
    """Hapus ruangan. Khusus admin/superadmin."""

    if not delete_room(room_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruangan tidak ditemukan",
        )
