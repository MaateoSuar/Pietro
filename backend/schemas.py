from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

# Auth
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Clients
class ClientBase(BaseModel):
    name: str
    phone: str
    status: Optional[str] = "nuevo"
    tags: Optional[str] = ""
    last_contact: Optional[datetime] = None
    owner: Optional[str] = ""
    next_action: Optional[datetime] = None
    notes: Optional[str] = ""
    zone: Optional[str] = ""

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[str] = None
    last_contact: Optional[datetime] = None
    owner: Optional[str] = None
    next_action: Optional[datetime] = None
    notes: Optional[str] = None
    zone: Optional[str] = None

class ClientOut(ClientBase):
    id: int
    class Config:
        from_attributes = True


class ControlVariablesBase(BaseModel):
    coeficiente_regular: float = 1.5
    dias_nuevos: int = 7
    pedidos_activo_frecuente: int = 2
    pedidos_nuevo: int = 1
    pedidos_vip: int = 5


class ControlVariablesCreate(ControlVariablesBase):
    pass


class ControlVariablesOut(ControlVariablesBase):
    id: int

    class Config:
        from_attributes = True


class ControlFrequencyBase(BaseModel):
    frecuencia: int
    frecuencia_coef: float


class ControlFrequencyCreate(ControlFrequencyBase):
    pass


class ControlFrequencyOut(ControlFrequencyBase):
    id: int

    class Config:
        from_attributes = True


class ChurnRowOut(BaseModel):
    contacto: str
    fecha_cumple: Optional[datetime] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    clasificacion: str
    cantidad_pedidos: int
    facturacion_total: float
    facturacion_promedio: float
    dias_ultimo_pedido: int
    primer_pedido: datetime
    ultimo_pedido: datetime
    frecuencia: float
    frecuencia_coef: float

class MovementBase(BaseModel):
    date: datetime
    type: str
    seller: Optional[str] = None
    description: Optional[str] = ""
    expense_category: Optional[str] = ""
    contact: str
    status: Optional[str] = ""
    payment_method: Optional[str] = ""
    value: float


class MovementCreate(MovementBase):
    pass


class MovementOut(MovementBase):
    id: int

    class Config:
        from_attributes = True

# Broadcasts
class BroadcastCreate(BaseModel):
    message: Optional[str] = ""
    image_url: Optional[str] = None
    recipients: List[str]

class BroadcastOut(BaseModel):
    id: int
    message: Optional[str] = ""
    image_url: Optional[str] = None
    recipients: List[str]
    scheduled_time: Optional[datetime] = None
    status: str
    class Config:
        from_attributes = True
