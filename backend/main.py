from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request
import os

from routers.auth import router as auth_router, get_current_user
from routers.clients import router as clients_router
from routers.broadcasts import router as broadcasts_router
from routers.uploads import router as uploads_router
from routers.whatsapp import router as whatsapp_router
from routers.movements import router as movements_router
from routers.churn import router as churn_router
from database import Base, engine, get_db
from sqlalchemy.orm import Session
from fastapi import Depends
import uvicorn

app = FastAPI(title="Pietro CRM API", version="0.1.0")

# CORS: permitir el frontend local y archivos estáticos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

# Static uploads
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
templates_dir = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=templates_dir)

# Static assets (project root /static)
STATIC_DIR = os.path.join(project_root, "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Serve frontend assets (carpeta /assets del proyecto) bajo /assets
assets_dir = os.path.join(project_root, "assets")
if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return RedirectResponse(url="/login")

@app.get("/stats")
def stats(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    from models import Client, Broadcast, Movement
    from datetime import datetime, timedelta

    # Métricas clásicas de clientes/difusiones
    total_clientes = db.query(Client).count()
    threshold = datetime.utcnow() - timedelta(days=30)
    sin_contacto = db.query(Client).filter((Client.last_contact == None) | (Client.last_contact < threshold)).count()
    enviados = db.query(Broadcast).filter(Broadcast.status == "sent").count()
    programadas = db.query(Broadcast).filter(Broadcast.status == "scheduled").count()

    # KPIs desde movimientos
    movimientos = db.query(Movement).all()
    ingresos_totales = float(sum(m.value or 0 for m in movimientos))

    cutoff_30d = datetime.utcnow() - timedelta(days=30)
    mov_30d = [m for m in movimientos if m.date and m.date >= cutoff_30d]
    pedidos_30d = len(mov_30d)
    ingresos_30d = float(sum(m.value or 0 for m in mov_30d))
    ticket_promedio_30d = ingresos_30d / pedidos_30d if pedidos_30d else 0.0

    # Clientes activos últimos 30 días (por contacto)
    contactos_activos = { (m.contact or '').strip() for m in mov_30d if (m.contact or '').strip() }
    clientes_activos_30d = len(contactos_activos)

    return {
        "clientes_totales": total_clientes,
        "clientes_sin_contacto_30d": sin_contacto,
        "difusiones_enviadas": enviados,
        "difusiones_programadas": programadas,
        "ingresos_totales": ingresos_totales,
        "ingresos_30d": ingresos_30d,
        "pedidos_30d": pedidos_30d,
        "ticket_promedio_30d": ticket_promedio_30d,
        "clientes_activos_30d": clientes_activos_30d,
    }

@app.get("/home")
def home():
    return RedirectResponse(url="/index.html")

@app.get("/index.html")
def serve_index():
    return FileResponse(os.path.join(project_root, "index.html"), media_type="text/html")


@app.get("/script.js")
def serve_main_script():
    return FileResponse(os.path.join(project_root, "script.js"), media_type="application/javascript")

@app.get("/clients.html")
def serve_clients():
    return FileResponse(os.path.join(project_root, "clients.html"), media_type="text/html")

@app.get("/broadcasts.html")
def serve_broadcasts():
    return FileResponse(os.path.join(project_root, "broadcasts.html"), media_type="text/html")

@app.get("/nuevo-cliente.html")
def serve_new_client():
    return FileResponse(os.path.join(project_root, "nuevo-cliente.html"), media_type="text/html")

@app.get("/tablero")
def serve_tablero():
    return FileResponse(os.path.join(project_root, "tablero.html"), media_type="text/html")

@app.get("/NuevoCliente")
def serve_new_client_pretty():
    return FileResponse(os.path.join(project_root, "nuevo-cliente.html"), media_type="text/html")

@app.get("/Clientes")
def serve_clients_pretty():
    return FileResponse(os.path.join(project_root, "clients.html"), media_type="text/html")

@app.get("/Tablero")
def serve_tablero_pretty():
    return FileResponse(os.path.join(project_root, "tablero.html"), media_type="text/html")

@app.get("/Difusiones")
def serve_broadcasts_pretty():
    return RedirectResponse(url="/difusiones")


@app.get("/churn-view")
def serve_churn_view():
    return FileResponse(os.path.join(project_root, "churn.html"), media_type="text/html")

@app.get("/me")
def me(user: str = Depends(get_current_user)):
    return {"user": user}

# Broadcasts views (HTML)
@app.get("/difusiones", response_class=HTMLResponse)
def difusiones_view(request: Request):
    return templates.TemplateResponse("difusiones.html", {"request": request})

@app.get("/difusiones/nueva", response_class=HTMLResponse)
def difusiones_new_view(request: Request):
    return templates.TemplateResponse("difusiones_form.html", {"request": request, "mode": "create"})

@app.get("/difusiones/editar/{broadcast_id}", response_class=HTMLResponse)
def difusiones_edit_view(broadcast_id: int, request: Request):
    return templates.TemplateResponse("difusiones_form.html", {"request": request, "mode": "edit", "broadcast_id": broadcast_id})

# Routers
app.include_router(auth_router, prefix="", tags=["auth"])  # /login
app.include_router(clients_router, prefix="/clientes", tags=["clientes"])  # CRUD + filtrar
app.include_router(movements_router, prefix="/movimientos", tags=["movimientos"])  # movimientos de ventas/gastos
app.include_router(broadcasts_router, prefix="/difusiones", tags=["difusiones"])  # crear/listar/programar
app.include_router(uploads_router, prefix="", tags=["uploads"])  # /upload-image
app.include_router(whatsapp_router, prefix="", tags=["whatsapp"])  # /whatsapp/send
app.include_router(churn_router, prefix="/churn", tags=["churn"])  # métricas de churn

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
