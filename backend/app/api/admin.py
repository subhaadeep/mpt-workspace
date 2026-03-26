from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.user import User, SUPER_ADMIN_USERNAME
from app.models.access_request import AccessRequest
from app.models.login_log import LoginLog
from app.schemas.user import UserCreate, UserOut, UserUpdate, UserWithPassword, AccessRequestOut, TransferSuperAdmin
from app.schemas.login_log import LoginLogOut
from app.core.deps import get_current_admin, get_current_super_admin
from app.core.security import get_password_hash

router = APIRouter()


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/users/passwords", response_model=List[UserWithPassword])
def list_users_with_passwords(
    db: Session = Depends(get_db),
    super_admin: User = Depends(get_current_super_admin)
):
    """Super admin only — returns plain_password field for all users."""
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
        plain_password=data.password,
        can_access_bots=data.can_access_bots,
        can_access_youtube=data.can_access_youtube,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_super_admin and data.is_admin is False:
        raise HTTPException(status_code=403, detail="Cannot demote the super admin. Transfer super admin role first.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/password", status_code=204)
def reset_user_password(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    super_admin: User = Depends(get_current_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_pw = body.get("password", "")
    if not new_pw:
        raise HTTPException(status_code=400, detail="Password required")
    user.hashed_password = get_password_hash(new_pw)
    user.plain_password = new_pw
    db.commit()


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # Super admins are not allowed to delete anyone
    if admin.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admins cannot delete users.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_super_admin:
        raise HTTPException(status_code=403, detail="Cannot delete the super admin account.")
    db.delete(user)
    db.commit()


@router.post("/transfer-super-admin", response_model=UserOut)
def transfer_super_admin(
    data: TransferSuperAdmin,
    db: Session = Depends(get_db),
    current_super: User = Depends(get_current_super_admin)
):
    new_super = db.query(User).filter(User.id == data.new_super_admin_id).first()
    if not new_super:
        raise HTTPException(status_code=404, detail="Target user not found")
    if not new_super.is_admin:
        raise HTTPException(status_code=400, detail="Target user must already be an admin")
    if new_super.id == current_super.id:
        raise HTTPException(status_code=400, detail="You are already the super admin")
    current_super.is_super_admin = False
    new_super.is_super_admin = True
    db.commit()
    db.refresh(new_super)
    return new_super


@router.get("/login-logs", response_model=List[LoginLogOut])
def get_login_logs(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    logs = db.query(LoginLog).order_by(LoginLog.logged_in_at.desc()).limit(200).all()
    result = []
    for log in logs:
        result.append(LoginLogOut(
            id=log.id,
            user_id=log.user_id,
            username=log.user.username if log.user else "deleted",
            full_name=log.user.full_name if log.user else None,
            logged_in_at=log.logged_in_at,
            logged_out_at=log.logged_out_at,
            is_active=log.is_active,
        ))
    return result


# ── Access Requests ─────────────────────────────────────────────

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
        plain_password=req.plain_password if hasattr(req, 'plain_password') else None,
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
