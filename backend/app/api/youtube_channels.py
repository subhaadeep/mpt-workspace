from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.youtube_channel import YouTubeChannel
from app.schemas.youtube_channel import ChannelCreate, ChannelOut
from app.core.deps import get_current_admin, require_youtube_access
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[ChannelOut])
def list_channels(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_youtube_access),
):
    return db.query(YouTubeChannel).order_by(YouTubeChannel.name).all()


@router.post("/", response_model=ChannelOut, status_code=status.HTTP_201_CREATED)
def create_channel(
    data: ChannelCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),  # only admins can create channels
):
    existing = db.query(YouTubeChannel).filter(YouTubeChannel.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Channel with this name already exists")
    channel = YouTubeChannel(**data.model_dump(), created_by=admin.id)
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    channel = db.query(YouTubeChannel).filter(YouTubeChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    db.delete(channel)
    db.commit()
