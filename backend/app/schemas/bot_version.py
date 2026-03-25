from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class BotVersionCreate(BaseModel):
    version_name: str
    notes: Optional[str] = None
    changes_description: Optional[str] = None
    implemented_features: Optional[List[str]] = None
    planned_changes: Optional[List[str]] = None
    inputs: Optional[List[Any]] = None
    screenshots: Optional[List[Any]] = None
    extra_sections: Optional[List[Any]] = None

# keep old alias for API compatibility
VersionCreate = BotVersionCreate


class BotVersionUpdate(BaseModel):
    version_name: Optional[str] = None
    notes: Optional[str] = None
    changes_description: Optional[str] = None
    implemented_features: Optional[List[str]] = None
    planned_changes: Optional[List[str]] = None
    inputs: Optional[List[Any]] = None
    screenshots: Optional[List[Any]] = None
    extra_sections: Optional[List[Any]] = None

VersionUpdate = BotVersionUpdate


class BotVersionOut(BaseModel):
    id: int
    bot_id: int
    version_name: str
    notes: Optional[str]
    changes_description: Optional[str]
    implemented_features: Optional[List[str]]
    planned_changes: Optional[List[str]]
    inputs: Optional[List[Any]]
    screenshots: Optional[List[Any]]
    extra_sections: Optional[List[Any]]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}

VersionOut = BotVersionOut
