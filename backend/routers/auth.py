import os
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.templating import Jinja2Templates
from jose import jwt, JWTError
from schemas import LoginRequest, TokenResponse

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecret-pietro")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60

ADMIN_USER = os.getenv("ADMIN_USER", "pietro")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "pietro")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# Templates directory: backend/templates
_templates_dir = Path(__file__).resolve().parent.parent / "templates"
templates = Jinja2Templates(directory=str(_templates_dir))

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    if payload.username == ADMIN_USER and payload.password == ADMIN_PASSWORD:
        token = create_access_token({"sub": payload.username})
        return TokenResponse(access_token=token)
    raise HTTPException(status_code=401, detail="Usuario o contraseña inválidos")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=401, detail="No autorizado")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception
