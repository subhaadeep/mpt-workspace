from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserOut, AccessRequestCreate, AccessRequestOut
from app.models.user import User
from app.models.access_request import AccessRequest
from app.core.deps import get_current_user
from app.core.security import get_password_hash, verify_password
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class UpdateMeRequest(BaseModel):
    full_name: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UpdateMeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="New password too short")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


# Public endpoint — no auth required
@router.post("/request-access", response_model=AccessRequestOut, status_code=status.HTTP_201_CREATED)
def request_access(data: AccessRequestCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    existing_req = db.query(AccessRequest).filter(
        AccessRequest.username == data.username,
        AccessRequest.status == "pending"
    ).first()
    if existing_req:
        raise HTTPException(status_code=400, detail="A request with this username is already pending")
    req = AccessRequest(
        username=data.username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req
