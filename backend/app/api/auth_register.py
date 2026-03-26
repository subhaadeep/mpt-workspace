# Registration route — stores plain password for super admin view
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.access_request import AccessRequest
from app.schemas.user import AccessRequestCreate
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/request-access", status_code=201)
def request_access(data: AccessRequestCreate, db: Session = Depends(get_db)):
    existing_user_req = db.query(AccessRequest).filter(
        AccessRequest.username == data.username,
        AccessRequest.status == "pending"
    ).first()
    if existing_user_req:
        raise HTTPException(status_code=400, detail="A pending request already exists for this username")
    req = AccessRequest(
        username=data.username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        plain_password=data.password,
    )
    db.add(req)
    db.commit()
    return {"message": "Access request submitted. Wait for admin approval."}
