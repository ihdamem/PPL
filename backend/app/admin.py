from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel

from app.models import User, Role
from app.auth import require_user
from app.database import list_users, update_user_role

router = APIRouter(prefix="/admin", tags=["admin"])


class RoleUpdateRequest(BaseModel):
    role: Role  # hanya booker / admin yang valid untuk di-set


def require_superadmin(current_user: User = Depends(require_user)) -> User:
    """Guard: hanya superadmin yang boleh mengelola role user."""

    if current_user.role != Role.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya superadmin yang dapat mengelola user",
        )
    return current_user


@router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(require_superadmin)):
    """Daftar seluruh user beserta role-nya. Khusus superadmin."""

    return list_users()


@router.patch("/users/{sub}/role", response_model=User)
async def set_user_role(
    sub: str,
    payload: RoleUpdateRequest,
    current_user: User = Depends(require_superadmin),
):
    """Promosi/demosi user menjadi admin atau booker. Khusus superadmin."""

    if payload.role == Role.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role superadmin tidak dapat diberikan lewat endpoint ini",
        )

    target = update_user_role(sub=sub, role=payload.role)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan",
        )

    return target
