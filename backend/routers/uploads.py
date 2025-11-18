import os
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from routers.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), user: str = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo imágenes")
    filename = file.filename
    dest_path = os.path.join(UPLOAD_DIR, filename)
    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)
    # Nota: servir archivos estáticos depende del host. Devolvemos ruta relativa.
    return {"file_url": f"/uploads/{filename}"}
