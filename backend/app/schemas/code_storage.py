from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.code_storage import CodeLanguage


class CodeCreate(BaseModel):
    language: CodeLanguage = CodeLanguage.python
    filename: Optional[str] = None
    code_content: Optional[str] = None
    description: Optional[str] = None


class CodeUpdate(BaseModel):
    language: Optional[CodeLanguage] = None
    filename: Optional[str] = None
    code_content: Optional[str] = None
    description: Optional[str] = None


class CodeOut(CodeCreate):
    id: int
    version_id: int
    file_path: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
