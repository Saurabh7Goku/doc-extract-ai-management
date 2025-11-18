from fastapi import WebSocket
from typing import Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        self.active_connections[task_id] = websocket

    def disconnect(self, task_id: str):
        self.active_connections.pop(task_id, None)

    async def send_status(self, task_id: str, status: str, message: str | None = None, result: dict | None = None):
        ws = self.active_connections.get(task_id)
        if ws:
            payload = {"status": status}
            if message:
                payload["message"] = message
            if result:
                payload["result"] = result
            try:
                await ws.send_json(payload)
            except:
                self.disconnect(task_id)

manager = ConnectionManager()

