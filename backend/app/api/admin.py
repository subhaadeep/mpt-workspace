from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.user import User
from app.models.access_request import AccessRequest
from app.schemas.user import UserCreate, UserOut, UserUpdate, AccessRequestOut
from app.core.deps import get_current_admin
from app.core.security import get_password_hash

router = APIRouter()


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=data.username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        can_access_bots=data.can_access_bots,
        can_access_youtube=data.can_access_youtube,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin account")
    db.delete(user)
    db.commit()


# ── Access Requests ──────────────────────────────────────────

@router.get("/access-requests", response_model=List[AccessRequestOut])
def list_access_requests(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(AccessRequest).order_by(AccessRequest.created_at.desc()).all()


@router.post("/access-requests/{req_id}/approve", response_model=UserOut)
def approve_request(
    req_id: int,
    can_access_bots: bool = False,
    can_access_youtube: bool = False,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    req = db.query(AccessRequest).filter(AccessRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = User(
        username=req.username,
        full_name=req.full_name,
        hashed_password=req.hashed_password,
        can_access_bots=can_access_bots,
        can_access_youtube=can_access_youtube,
        is_active=True,
    )
    db.add(user)
    req.status = "approved"
    db.commit()
    db.refresh(user)
    return user


@router.post("/access-requests/{req_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_request(req_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    req = db.query(AccessRequest).filter(AccessRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "rejected"
    db.commit()
