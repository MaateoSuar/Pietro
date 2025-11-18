import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Broadcast
from schemas import BroadcastCreate, BroadcastOut
from routers.auth import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[BroadcastOut])
def list_broadcasts(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    items = db.query(Broadcast).order_by(Broadcast.id.desc()).all()
    out = []
    for b in items:
        out.append(BroadcastOut(
            id=b.id,
            message=b.message,
            image_url=b.image_url,
            recipients=json.loads(b.recipients_json or "[]"),
            scheduled_time=b.scheduled_time,
            status=b.status,
        ))
    return out

@router.get("/{broadcast_id}", response_model=BroadcastOut)
def get_broadcast(broadcast_id: int, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    b = db.get(Broadcast, broadcast_id)
    if not b:
        raise HTTPException(status_code=404, detail="Difusión no encontrada")
    return BroadcastOut(
        id=b.id,
        message=b.message,
        image_url=b.image_url,
        recipients=json.loads(b.recipients_json or "[]"),
        scheduled_time=b.scheduled_time,
        status=b.status,
    )

@router.post("/", response_model=BroadcastOut)
def create_broadcast(payload: BroadcastCreate, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    b = Broadcast(
        message=payload.message or "",
        image_url=payload.image_url,
        recipients_json=json.dumps(payload.recipients),
        status="draft",
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return BroadcastOut(
        id=b.id,
        message=b.message,
        image_url=b.image_url,
        recipients=json.loads(b.recipients_json or "[]"),
        scheduled_time=b.scheduled_time,
        status=b.status,
    )

@router.post("/programar", response_model=BroadcastOut)
def schedule_broadcast(id: int, when: datetime, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    b = db.get(Broadcast, id)
    if not b:
        raise HTTPException(status_code=404, detail="Difusión no encontrada")
    b.scheduled_time = when
    b.status = "scheduled"
    db.commit()
    db.refresh(b)
    return BroadcastOut(
        id=b.id,
        message=b.message,
        image_url=b.image_url,
        recipients=json.loads(b.recipients_json or "[]"),
        scheduled_time=b.scheduled_time,
        status=b.status,
    )

@router.put("/{broadcast_id}", response_model=BroadcastOut)
def update_broadcast(
    broadcast_id: int,
    payload: BroadcastCreate,
    when: Optional[datetime] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    b = db.get(Broadcast, broadcast_id)
    if not b:
        raise HTTPException(status_code=404, detail="Difusión no encontrada")
    b.message = payload.message or ""
    b.image_url = payload.image_url
    b.recipients_json = json.dumps(payload.recipients or [])
    if when is not None:
        b.scheduled_time = when
    if status is not None:
        b.status = status
    db.commit()
    db.refresh(b)
    return BroadcastOut(
        id=b.id,
        message=b.message,
        image_url=b.image_url,
        recipients=json.loads(b.recipients_json or "[]"),
        scheduled_time=b.scheduled_time,
        status=b.status,
    )

@router.delete("/{broadcast_id}")
def delete_broadcast(broadcast_id: int, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    b = db.get(Broadcast, broadcast_id)
    if not b:
        raise HTTPException(status_code=404, detail="Difusión no encontrada")
    db.delete(b)
    db.commit()
    return {"ok": True}
