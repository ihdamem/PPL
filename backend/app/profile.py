"""Authenticated user profile endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import require_user
from app.database import get_user_by_sub, update_profile
from app.models import User


router = APIRouter(
    prefix="/profile",
    tags=["profile"],
)


class ProfileUpdate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    nomor_induk: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    departemen: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )


@router.get(
    "",
    response_model=User,
)
async def get_profile(
    current_user: User = Depends(require_user),
) -> User:

    user = get_user_by_sub(current_user.sub)

    if user is None:
        return current_user

    return user


@router.put(
    "",
    response_model=User,
)
async def save_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(require_user),
) -> User:

    user = get_user_by_sub(current_user.sub)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Akun belum terdaftar di database. "
                "Silakan logout dan login kembali."
            ),
        )

    name = payload.name.strip()
    nomor_induk = payload.nomor_induk.strip()
    departemen = payload.departemen.strip()

    if not name or not nomor_induk or not departemen:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Nama, nomor induk, dan departemen wajib diisi."
            ),
        )

    updated = update_profile(
        sub=current_user.sub,
        name=name,
        nomor_induk=nomor_induk,
        departemen=departemen,
    )

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan",
        )

    return updated