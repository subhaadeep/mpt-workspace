import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.models.upload import UploadedFile
from app.core.deps import require_bot_access
from app.core.config import settings
from app.models.user import User

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    version_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_bot_access),
):
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB.")

    ext = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)

    record = UploadedFile(
        version_id=version_id,
        original_filename=file.filename,
        stored_filename=stored_name,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type,
        uploaded_by=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "filename": file.filename, "url": f"/uploads/{stored_name}"}
