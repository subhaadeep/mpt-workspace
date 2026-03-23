from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.bot_version import BotVersion
from app.schemas.bot_version import VersionCreate, VersionUpdate, VersionOut
from app.core.deps import require_bot_access
from app.models.user import User

router = APIRouter()


@router.get("/{bot_id}/versions", response_model=List[VersionOut])
def list_versions(bot_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    return db.query(BotVersion).filter(BotVersion.bot_id == bot_id).order_by(BotVersion.created_at.desc()).all()


@router.post("/{bot_id}/versions", response_model=VersionOut, status_code=status.HTTP_201_CREATED)
def create_version(bot_id: int, data: VersionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    version = BotVersion(**data.model_dump(), bot_id=bot_id)
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


@router.get("/{bot_id}/versions/{version_id}", response_model=VersionOut)
def get_version(bot_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    v = db.query(BotVersion).filter(BotVersion.id == version_id, BotVersion.bot_id == bot_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")
    return v


@router.patch("/{bot_id}/versions/{version_id}", response_model=VersionOut)
def update_version(bot_id: int, version_id: int, data: VersionUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    v = db.query(BotVersion).filter(BotVersion.id == version_id, BotVersion.bot_id == bot_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(v, key, value)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{bot_id}/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_version(bot_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    v = db.query(BotVersion).filter(BotVersion.id == version_id, BotVersion.bot_id == bot_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")
    db.delete(v)
    db.commit()
