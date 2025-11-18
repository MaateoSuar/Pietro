from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Client
from schemas import ClientCreate, ClientUpdate, ClientOut
from routers.auth import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[ClientOut])
def list_clients(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return db.query(Client).order_by(Client.id.desc()).all()

@router.get("/filtrar", response_model=List[ClientOut])
def filter_clients(
    estado: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    query = db.query(Client)
    if estado:
        query = query.filter(Client.status == estado)
    if tag:
        query = query.filter(Client.tags.like(f"%{tag}%"))
    if q:
        qlike = f"%{q}%"
        query = query.filter((Client.name.like(qlike)) | (Client.phone.like(qlike)) | (Client.notes.like(qlike)))
    return query.order_by(Client.id.desc()).all()

@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = db.get(Client, client_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return obj

@router.post("/", response_model=ClientOut)
def create_client(payload: ClientCreate, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = Client(**payload.dict())
    obj.updated_at = datetime.utcnow()
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{client_id}", response_model=ClientOut)
def update_client(client_id: int, payload: ClientUpdate, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = db.get(Client, client_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = db.get(Client, client_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(obj)
    db.commit()
    return {"ok": True}
