from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func
from database import Base

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False, index=True)
    status = Column(String(50), default="nuevo")
    tags = Column(String(255), default="")
    last_contact = Column(DateTime, nullable=True)
    owner = Column(String(255), default="")
    next_action = Column(DateTime, nullable=True)
    notes = Column(Text, default="")
    zone = Column(String(255), default="")
    created_at = Column(DateTime, server_default=func.now())


class ControlVariables(Base):
    __tablename__ = "control_variables"
    id = Column(Integer, primary_key=True, index=True)
    coeficiente_regular = Column(Float, default=1.5)
    dias_nuevos = Column(Integer, default=7)
    pedidos_activo_frecuente = Column(Integer, default=2)
    pedidos_nuevo = Column(Integer, default=1)
    pedidos_vip = Column(Integer, default=5)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class ControlFrequency(Base):
    __tablename__ = "control_frequencies"
    id = Column(Integer, primary_key=True, index=True)
    frecuencia = Column(Integer, nullable=False)
    frecuencia_coef = Column(Float, nullable=False)


class Movement(Base):
    __tablename__ = "movements"
    id = Column(Integer, primary_key=True, index=True)
    # Fecha del movimiento/pedido
    date = Column(DateTime, nullable=False)
    # Tipo (Venta, Gasto, etc.)
    type = Column(String(50), nullable=False)
    # Vendedor
    seller = Column(String(255), nullable=True)
    # Descripción del movimiento
    description = Column(Text, default="")
    # Categoría de gasto
    expense_category = Column(String(255), default="")
    # Contacto (cliente)
    contact = Column(String(255), nullable=False)
    # Estado (Pagada, Pendiente, etc.)
    status = Column(String(50), default="")
    # Medio de pago
    payment_method = Column(String(50), default="")
    # Valor del movimiento
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class Broadcast(Base):
    __tablename__ = "broadcasts"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, default="")
    image_url = Column(String(500), nullable=True)
    recipients_json = Column(Text, default="[]")  # JSON list of phones
    scheduled_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="draft")  # draft|scheduled|sent|failed
    created_at = Column(DateTime, server_default=func.now())
