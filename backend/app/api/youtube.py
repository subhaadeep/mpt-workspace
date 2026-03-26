from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.youtube import YouTubeVideo, VideoStatus
from app.models.youtube_activity import YouTubeActivity
from app.models.deleted_video import DeletedVideo
from app.schemas.youtube import VideoCreate, VideoUpdate, VideoOut
from app.schemas.youtube_activity import YouTubeActivityOut, DeletedVideoOut
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
def create_video(
    data: VideoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_youtube_access)
):
    video = YouTubeVideo(**data.model_dump(), created_by=current_user.id)
    db.add(video)
    db.commit()
    db.refresh(video)
    # Log activity
    log = YouTubeActivity(
        video_id=video.id,
        video_title=video.title,
        action="created",
        from_status=None,
        to_status=video.status.value if video.status else None,
        done_by_id=current_user.id,
    )
    db.add(log)
    db.commit()
    return video


@router.get("/activity", response_model=List[YouTubeActivityOut])
def list_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_youtube_access)
):
    activities = db.query(YouTubeActivity).order_by(YouTubeActivity.created_at.desc()).limit(50).all()
    result = []
    for a in activities:
        out = YouTubeActivityOut(
            id=a.id,
            video_id=a.video_id,
            video_title=a.video_title,
            action=a.action,
            from_status=a.from_status,
            to_status=a.to_status,
            done_by_id=a.done_by_id,
            done_by_name=a.done_by.full_name or a.done_by.username if a.done_by else "Unknown",
            note=a.note,
            created_at=a.created_at,
        )
        result.append(out)
    return result


@router.get("/deleted", response_model=List[DeletedVideoOut])
def list_deleted(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_youtube_access)
):
    deleted = db.query(DeletedVideo).order_by(DeletedVideo.deleted_at.desc()).all()
    result = []
    for d in deleted:
        out = DeletedVideoOut(
            id=d.id,
            original_id=d.original_id,
            title=d.title,
            idea_description=d.idea_description,
            script=d.script,
            status_at_deletion=d.status_at_deletion,
            youtube_url=d.youtube_url,
            tags=d.tags,
            deleted_by_id=d.deleted_by_id,
            deleted_by_name=d.deleted_by.full_name or d.deleted_by.username if d.deleted_by else "Unknown",
            deleted_at=d.deleted_at,
        )
        result.append(out)
    return result


@router.get("/{video_id}", response_model=VideoOut)
def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_youtube_access)
):
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
    # Log if status changed (video moved)
    new_status = video.status
    if "status" in updates and old_status != new_status:
        log = YouTubeActivity(
            video_id=video.id,
            video_title=video.title,
            action="moved",
            from_status=old_status.value if hasattr(old_status, 'value') else str(old_status),
            to_status=new_status.value if hasattr(new_status, 'value') else str(new_status),
            done_by_id=current_user.id,
        )
        db.add(log)
        db.commit()
    return video


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_youtube_access)
):
    video = db.query(YouTubeVideo).filter(YouTubeVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    # Save to deleted_videos archive
    deleted = DeletedVideo(
        original_id=video.id,
        title=video.title,
        idea_description=video.idea_description,
        script=video.script,
        status_at_deletion=video.status.value if hasattr(video.status, 'value') else str(video.status),
        youtube_url=video.youtube_url,
        tags=video.tags,
        deleted_by_id=current_user.id,
    )
    db.add(deleted)
    # Log activity
    log = YouTubeActivity(
        video_id=None,
        video_title=video.title,
        action="deleted",
        from_status=video.status.value if hasattr(video.status, 'value') else str(video.status),
        to_status=None,
        done_by_id=current_user.id,
    )
    db.add(log)
    db.delete(video)
    db.commit()
