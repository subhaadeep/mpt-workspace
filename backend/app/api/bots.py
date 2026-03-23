from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.bot import Bot
from app.models.performance import PerformanceData
from app.models.ga_data import GAData
from app.models.test_data import TestData
from app.models.code_storage import CodeStorage
from app.models.documentation import Documentation
from app.schemas.bot import BotCreate, BotUpdate, BotOut
from app.schemas.performance import PerformanceCreate, PerformanceOut
from app.schemas.ga_data import GADataCreate, GADataOut
from app.schemas.test_data import TestDataCreate, TestDataOut
from app.schemas.code_storage import CodeCreate, CodeUpdate, CodeOut
from app.schemas.documentation import DocCreate, DocOut
from app.core.deps import require_bot_access, get_current_user
from app.models.user import User

router = APIRouter()


# --- BOT CRUD ---

@router.get("/", response_model=List[BotOut])
def list_bots(db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    return db.query(Bot).order_by(Bot.created_at.desc()).all()


@router.post("/", response_model=BotOut, status_code=status.HTTP_201_CREATED)
def create_bot(data: BotCreate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    bot = Bot(**data.model_dump(), created_by=current_user.id)
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot


@router.get("/{bot_id}", response_model=BotOut)
def get_bot(bot_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    bot = db.query(Bot).filter(Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot


@router.patch("/{bot_id}", response_model=BotOut)
def update_bot(bot_id: int, data: BotUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    bot = db.query(Bot).filter(Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(bot, key, value)
    db.commit()
    db.refresh(bot)
    return bot


@router.delete("/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bot(bot_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    bot = db.query(Bot).filter(Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    db.delete(bot)
    db.commit()


# --- PERFORMANCE DATA ---

@router.get("/{bot_id}/versions/{version_id}/performance", response_model=PerformanceOut)
def get_performance(bot_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    perf = db.query(PerformanceData).filter(PerformanceData.version_id == version_id).first()
    if not perf:
        raise HTTPException(status_code=404, detail="Performance data not found")
    return perf


@router.post("/{bot_id}/versions/{version_id}/performance", response_model=PerformanceOut)
def upsert_performance(bot_id: int, version_id: int, data: PerformanceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    perf = db.query(PerformanceData).filter(PerformanceData.version_id == version_id).first()
    if perf:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(perf, key, value)
    else:
        perf = PerformanceData(**data.model_dump(), version_id=version_id)
        db.add(perf)
    db.commit()
    db.refresh(perf)
    return perf


# --- GA DATA ---

@router.get("/{bot_id}/versions/{version_id}/ga", response_model=List[GADataOut])
def list_ga_runs(bot_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    return db.query(GAData).filter(GAData.version_id == version_id).all()


@router.post("/{bot_id}/versions/{version_id}/ga", response_model=GADataOut, status_code=201)
def add_ga_run(bot_id: int, version_id: int, data: GADataCreate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    ga = GAData(**data.model_dump(), version_id=version_id)
    db.add(ga)
    db.commit()
    db.refresh(ga)
    return ga


@router.delete("/{bot_id}/versions/{version_id}/ga/{ga_id}", status_code=204)
def delete_ga_run(bot_id: int, version_id: int, ga_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    ga = db.query(GAData).filter(GAData.id == ga_id, GAData.version_id == version_id).first()
    if not ga:
        raise HTTPException(status_code=404, detail="GA run not found")
    db.delete(ga)
    db.commit()


# --- TEST DATA ---

@router.get("/{bot_id}/versions/{version_id}/tests", response_model=List[TestDataOut])
def list_tests(bot_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    return db.query(TestData).filter(TestData.version_id == version_id).all()


@router.post("/{bot_id}/versions/{version_id}/tests", response_model=TestDataOut, status_code=201)
def add_test(bot_id: int, version_id: int, data: TestDataCreate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    test = TestData(**data.model_dump(), version_id=version_id)
    db.add(test)
    db.commit()
    db.refresh(test)
    return test


# --- CODE STORAGE ---

@router.get("/{bot_id}/versions/{version_id}/code", response_model=List[CodeOut])
def list_code(bot_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    return db.query(CodeStorage).filter(CodeStorage.version_id == version_id).all()


@router.post("/{bot_id}/versions/{version_id}/code", response_model=CodeOut, status_code=201)
def add_code(bot_id: int, version_id: int, data: CodeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    code = CodeStorage(**data.model_dump(), version_id=version_id)
    db.add(code)
    db.commit()
    db.refresh(code)
    return code


@router.patch("/{bot_id}/versions/{version_id}/code/{code_id}", response_model=CodeOut)
def update_code(bot_id: int, version_id: int, code_id: int, data: CodeUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    code = db.query(CodeStorage).filter(CodeStorage.id == code_id).first()
    if not code:
        raise HTTPException(status_code=404, detail="Code entry not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(code, key, value)
    db.commit()
    db.refresh(code)
    return code


@router.delete("/{bot_id}/versions/{version_id}/code/{code_id}", status_code=204)
def delete_code(bot_id: int, version_id: int, code_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    code = db.query(CodeStorage).filter(CodeStorage.id == code_id).first()
    if not code:
        raise HTTPException(status_code=404, detail="Code entry not found")
    db.delete(code)
    db.commit()


# --- DOCUMENTATION ---

@router.get("/{bot_id}/versions/{version_id}/docs", response_model=DocOut)
def get_docs(bot_id: int, version_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    doc = db.query(Documentation).filter(Documentation.version_id == version_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documentation not found")
    return doc


@router.post("/{bot_id}/versions/{version_id}/docs", response_model=DocOut)
def upsert_docs(bot_id: int, version_id: int, data: DocCreate, db: Session = Depends(get_db), current_user: User = Depends(require_bot_access)):
    doc = db.query(Documentation).filter(Documentation.version_id == version_id).first()
    if doc:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(doc, key, value)
    else:
        doc = Documentation(**data.model_dump(), version_id=version_id)
        db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc
