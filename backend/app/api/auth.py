from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest
from app.models.user import User
from app.models.login_log import LoginLog
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user
from datetime import datetime, timezone

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    # Mark any old active sessions as ended
    db.query(LoginLog).filter(LoginLog.user_id == user.id, LoginLog.is_active == True).update(
        {"is_active": False, "logged_out_at": datetime.now(timezone.utc)}
    )
    log = LoginLog(user_id=user.id, is_active=True)
    db.add(log)
    db.commit()
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", status_code=204)
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(LoginLog).filter(
        LoginLog.user_id == current_user.id, LoginLog.is_active == True
    ).update({"is_active": False, "logged_out_at": datetime.now(timezone.utc)})
    db.commit()


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    access_token = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=new_refresh)
