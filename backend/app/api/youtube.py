from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.youtube import YouTubeVideo, VideoStatus
from app.schemas.youtube import VideoCreate, VideoUpdate, VideoOut
from app.core.deps import require_youtube_access
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[VideoOut])
def list_videos(
    status: Optional[VideoStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_youtube_access),
):
    query = db.query(YouTubeVideo).order_by(YouTubeVideo.created_at.desc())
    if status:
        query = query.filter(YouTubeVideo.status == status)
    return query.all()


@router.post("/", response_model=VideoOut, status_code=status.HTTP_201_CREATED)
def create_video(data: VideoCreate, db: Session = Depends(get_db), current_user: User = Depends(require_youtube_access)):
    video = YouTubeVideo(**data.model_dump(), created_by=current_user.id)
    db.add(video)
    db.commit()
    db.refresh(video)
    return video


@router.get("/{video_id}", response_model=VideoOut)
def get_video(video_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_youtube_access)):
    video = db.query(YouTubeVideo).filter(YouTubeVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.patch("/{video_id}", response_model=VideoOut)
def update_video(
    video_id: int,
    data: VideoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_youtube_access)
):
    video = db.query(YouTubeVideo).filter(YouTubeVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    old_status = video.status
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(video, key, value)
    db.commit()
    db.refresh(video)
    # Attach old_status on response so frontend can compare
    video.__dict__['_old_status'] = old_status
    return video


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(video_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_youtube_access)):
    video = db.query(YouTubeVideo).filter(YouTubeVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    db.delete(video)
    db.commit()
