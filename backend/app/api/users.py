from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserOut, AccessRequestCreate, AccessRequestOut
from app.models.user import User
from app.models.access_request import AccessRequest
from app.core.deps import get_current_user
from app.core.security import get_password_hash

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


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
