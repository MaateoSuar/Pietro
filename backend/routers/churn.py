from collections import defaultdict
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Movement, ControlVariables, ControlFrequency
from routers.auth import get_current_user
from schemas import (
    ChurnRowOut,
    ControlVariablesOut,
    ControlVariablesCreate,
    ControlFrequencyOut,
    ControlFrequencyCreate,
)

router = APIRouter()


def get_or_create_control_variables(db: Session) -> ControlVariables:
    obj = db.query(ControlVariables).first()
    if obj:
        return obj
    obj = ControlVariables()
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def seed_frequencies_if_needed(db: Session):
    existing = db.query(ControlFrequency).count()
    if existing:
        return
    defaults = [
        (10, 15),
        (20, 30),
        (30, 45),
        (50, 75),
        (60, 90),
    ]
    for freq, freq_coef in defaults:
        db.add(ControlFrequency(frecuencia=freq, frecuencia_coef=freq_coef))
    db.commit()


@router.get("/", response_model=List[ChurnRowOut])
def calculate_churn(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    ctrl = get_or_create_control_variables(db)
    seed_frequencies_if_needed(db)
    freqs = db.query(ControlFrequency).order_by(ControlFrequency.frecuencia).all()

    # Agregar movimientos por contacto
    per_contact = defaultdict(list)
    movements = db.query(Movement).all()
    for m in movements:
        key = (m.contact or "").strip() or "(sin contacto)"
        per_contact[key].append(m)

    rows: List[ChurnRowOut] = []
    today = datetime.utcnow().date()

    for contact, items in per_contact.items():
        if not items:
            continue
        # ordenar por fecha
        items.sort(key=lambda x: x.date)
        dates = [i.date.date() for i in items if i.date]
        if not dates:
            continue
        primer = dates[0]
        ultimo = dates[-1]
        dias_ultimo = (today - ultimo).days
        cantidad = len(dates)
        fact_total = float(sum(i.value or 0 for i in items))
        fact_prom = fact_total / cantidad if cantidad else 0.0

        # frecuencia = días entre pedidos promedio
        if len(dates) > 1:
            span_days = (dates[-1] - dates[0]).days or 1
            frecuencia = span_days / (len(dates) - 1)
        else:
            frecuencia = float(ctrl.dias_nuevos)

        # buscar frecuencia*coef en tabla guía (o usar coef global)
        if freqs:
            # escoger la frecuencia más cercana por debajo o igual
            best = freqs[0]
            for f in freqs:
                if frecuencia >= f.frecuencia:
                    best = f
                else:
                    break
            frecuencia_coef = float(best.frecuencia_coef)
        else:
            frecuencia_coef = frecuencia * float(ctrl.coeficiente_regular)

        # clasificación muy aproximada basada en tu tabla (se puede refinar luego)
        if cantidad >= ctrl.pedidos_vip and dias_ultimo < ctrl.coeficiente_regular * frecuencia:
            clasificacion = "1.1"  # Clientes fidelizados
        elif cantidad >= ctrl.pedidos_activo_frecuente and dias_ultimo < ctrl.coeficiente_regular * frecuencia:
            clasificacion = "1.2"  # Clientes a fidelizar
        elif dias_ultimo > ctrl.coeficiente_regular * frecuencia and cantidad >= ctrl.pedidos_activo_frecuente:
            clasificacion = "2.1"  # Fidelizados perdidos
        elif dias_ultimo > ctrl.dias_nuevos:
            clasificacion = "2.2"  # No fidelizados perdidos
        else:
            clasificacion = "4.1"  # Nuevos

        rows.append(
            ChurnRowOut(
                contacto=contact,
                clasificacion=clasificacion,
                cantidad_pedidos=cantidad,
                facturacion_total=fact_total,
                facturacion_promedio=fact_prom,
                dias_ultimo_pedido=dias_ultimo,
                primer_pedido=datetime.combine(primer, datetime.min.time()),
                ultimo_pedido=datetime.combine(ultimo, datetime.min.time()),
                frecuencia=frecuencia,
                frecuencia_coef=frecuencia_coef,
            )
        )

    return rows


@router.get("/control/variables", response_model=ControlVariablesOut)
def get_control_variables(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = get_or_create_control_variables(db)
    return obj


@router.put("/control/variables", response_model=ControlVariablesOut)
def update_control_variables(payload: ControlVariablesCreate, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = get_or_create_control_variables(db)
    for field, value in payload.dict().items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/control/frequencies", response_model=List[ControlFrequencyOut])
def list_control_frequencies(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    seed_frequencies_if_needed(db)
    return db.query(ControlFrequency).order_by(ControlFrequency.frecuencia).all()


@router.put("/control/frequencies/{freq_id}", response_model=ControlFrequencyOut)
def update_control_frequency(freq_id: int, payload: ControlFrequencyCreate, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    obj = db.get(ControlFrequency, freq_id)
    if not obj:
        raise ValueError("Frecuencia no encontrada")
    for field, value in payload.dict().items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj
