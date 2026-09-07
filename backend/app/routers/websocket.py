from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.group import GroupMember
from app.websocket.manager import manager

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/groups/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: str,
    token: str = Query(None)
):
    if not token:
        await websocket.close(code=4001, reason="Authentication token missing")
        return

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=4002, reason="Invalid token")
        return

    user_id = payload["sub"]

    # Verify group membership
    db: Session = SessionLocal()
    try:
        member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first()
        if not member:
            await websocket.close(code=4003, reason="Forbidden")
            return
    finally:
        db.close()

    await manager.connect(group_id, websocket)
    try:
        while True:
            # Keep socket alive and listening
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(group_id, websocket)
