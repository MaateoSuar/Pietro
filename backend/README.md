# Pietro CRM Backend (FastAPI)

## Run local
```
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
set DB_URL=sqlite:///./pietro.db
uvicorn main:app --reload
```
API: http://127.0.0.1:8000
Docs: http://127.0.0.1:8000/docs

## Env vars
- DB_URL (default sqlite)
- SECRET_KEY
- ADMIN_USER, ADMIN_PASSWORD
- WHATSAPP_TOKEN, PHONE_NUMBER_ID (futuro)

## Deploy en Railway
- Crea un nuevo servicio Python apuntando a folder `backend`.
- Setea Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Carga env vars: `DB_URL`, `SECRET_KEY`, `ADMIN_USER`, `ADMIN_PASSWORD`.

