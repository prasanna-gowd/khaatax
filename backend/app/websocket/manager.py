import json
from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # group_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, group_id: str, websocket: WebSocket):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, group_id: str, websocket: WebSocket):
        if group_id in self.active_connections:
            if websocket in self.active_connections[group_id]:
                self.active_connections[group_id].remove(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def broadcast_to_group(self, group_id: str, event_type: str, data: dict):
        if group_id not in self.active_connections:
            return
        
        payload = json.dumps({
            "event": event_type,
            "data": data
        })

        stale_connections = []
        for connection in self.active_connections[group_id]:
            try:
                await connection.send_text(payload)
            except Exception:
                stale_connections.append(connection)

        # Cleanup disconnected clients
        for dead in stale_connections:
            self.disconnect(group_id, dead)

manager = ConnectionManager()
