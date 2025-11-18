from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Movement
from schemas import MovementCreate, MovementOut
from routers.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[MovementOut])
def list_movements(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return db.query(Movement).order_by(Movement.date.desc(), Movement.id.desc()).all()


@router.post("/", response_model=MovementOut)
def create_movement(payload: MovementCreate, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = Movement(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{movement_id}", response_model=MovementOut)
def get_movement(movement_id: int, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = db.get(Movement, movement_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return obj


@router.delete("/{movement_id}")
def delete_movement(movement_id: int, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = db.get(Movement, movement_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    db.delete(obj)
    db.commit()
    return {"ok": True}
