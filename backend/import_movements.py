import csv
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from database import SessionLocal
from models import Movement


CSV_PATH = Path(__file__).parent.parent / "data" / "CRM - Zentra - Registro de clientes.csv"


def parse_row(row: dict):
    """Mapea una fila del CSV al diccionario de campos Movement.

    Columnas esperadas (por encabezado):
    Fecha, Tipo, Vendedor, Descripción, Categoria de Gasto, Contacto, Estado, M. de Pago, Valor
    """
    # Ajustar nombres de columnas según el CSV real
    fecha_raw = row.get("Fecha") or row.get("fecha")
    tipo = row.get("Tipo") or ""
    vendedor = row.get("Vendedor") or ""
    descripcion = row.get("Descripción") or row.get("Descripcion") or ""
    categoria = row.get("Categoria de Gasto") or row.get("Categoría de Gasto") or ""
    contacto = row.get("Contacto") or ""
    estado = row.get("Estado") or ""
    medio_pago = row.get("M. de Pago") or row.get("Medio de Pago") or ""
    valor_raw = row.get("Valor") or row.get("Importe") or "0"

    # Parse fecha (dd/mm/aaaa)
    date = None
    if fecha_raw:
        for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
            try:
                date = datetime.strptime(fecha_raw.strip(), fmt)
                break
            except ValueError:
                continue
    if date is None:
        raise ValueError(f"No se pudo parsear fecha: {fecha_raw!r}")

    # Parse valor, limpiando símbolos y separadores
    valor_s = str(valor_raw).replace("$", "").replace(".", "").replace(" ", "").replace("ARS", "")
    valor_s = valor_s.replace(",", ".")
    try:
        valor = float(valor_s)
    except ValueError:
        raise ValueError(f"No se pudo parsear valor: {valor_raw!r} -> {valor_s!r}")

    return {
        "date": date,
        "type": tipo.strip(),
        "seller": vendedor.strip(),
        "description": descripcion.strip(),
        "expense_category": categoria.strip(),
        "contact": contacto.strip(),
        "status": estado.strip(),
        "payment_method": medio_pago.strip(),
        "value": valor,
    }


def import_movements():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV no encontrado en {CSV_PATH}")

    db: Session = SessionLocal()
    try:
        with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                if not any(row.values()):
                    continue
                data = parse_row(row)
                obj = Movement(**data)
                db.add(obj)
                count += 1
            db.commit()
        print(f"Importados {count} movimientos desde {CSV_PATH}")
    finally:
        db.close()


if __name__ == "__main__":
    import_movements()
