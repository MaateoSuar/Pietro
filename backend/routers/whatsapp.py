import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from routers.auth import get_current_user

router = APIRouter()

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")
GRAPH_BASE = os.getenv("WHATSAPP_GRAPH_BASE", "https://graph.facebook.com/v17.0")

class WhatsAppSendRequest(BaseModel):
    message: str
    recipients: List[str]
    image_url: Optional[str] = None

@router.post("/whatsapp/send")
async def whatsapp_send(payload: WhatsAppSendRequest, user: str = Depends(get_current_user)):
    if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID:
        raise HTTPException(status_code=500, detail="Faltan WHATSAPP_TOKEN o PHONE_NUMBER_ID en variables de entorno")

    url = f"{GRAPH_BASE}/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=20) as client:
        results = []
        for raw in payload.recipients:
            to = raw.strip().lstrip("+")
            if not to:
                continue
            body: dict
            if payload.image_url:
                body = {
                    "messaging_product": "whatsapp",
                    "to": to,
                    "type": "image",
                    "image": {"link": payload.image_url, "caption": payload.message or ""}
                }
            else:
                body = {
                    "messaging_product": "whatsapp",
                    "to": to,
                    "type": "text",
                    "text": {"body": payload.message or ""}
                }
            r = await client.post(url, headers=headers, json=body)
            if r.status_code >= 400:
                try:
                    detail = r.json()
                except Exception:
                    detail = r.text
                results.append({"to": to, "ok": False, "error": detail})
            else:
                results.append({"to": to, "ok": True, "response": r.json()})

    any_fail = any(not x.get("ok") for x in results)
    if any_fail:
        # No fallar toda la petición: devolvemos detalle por destinatario
        return {"partial": True, "results": results}
    return {"ok": True, "results": results}
