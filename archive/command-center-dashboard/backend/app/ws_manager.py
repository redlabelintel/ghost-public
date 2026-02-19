import asyncio
import json
import logging
from typing import Dict, Set, Any, Optional
from datetime import datetime

import socketio
import uvicorn
from fastapi import FastAPI

from app.config import settings

logger = logging.getLogger(__name__)


class WebSocketManager:
    """WebSocket connection manager using Socket.IO"""
    
    def __init__(self):
        self.sio = socketio.AsyncServer(
            cors_allowed_origins=settings.ALLOWED_ORIGINS,
            logger=False,
            engineio_logger=False
        )
        self.app = FastAPI()
        self.app = socketio.ASGIApp(self.sio, self.app)
        
        # Connection tracking
        self.connections: Dict[str, Dict[str, Any]] = {}
        self.rooms: Dict[str, Set[str]] = {}
        self.server = None
        
        self.setup_event_handlers()
    
    def setup_event_handlers(self):
        """Setup Socket.IO event handlers"""
        
        @self.sio.event
        async def connect(sid, environ):
            """Handle client connection"""
            logger.info(f"Client connected: {sid}")
            
            # Store connection info
            self.connections[sid] = {
                "connected_at": datetime.utcnow().isoformat(),
                "rooms": set(),
                "user_id": None,
                "ip_address": environ.get("REMOTE_ADDR"),
                "user_agent": environ.get("HTTP_USER_AGENT"),
            }
            
            # Send welcome message
            await self.sio.emit("connected", {
                "message": "Connected to Command Center Dashboard",
                "sid": sid,
                "timestamp": datetime.utcnow().isoformat()
            }, room=sid)
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            logger.info(f"Client disconnected: {sid}")
            
            # Remove from all rooms
            if sid in self.connections:
                for room in self.connections[sid]["rooms"]:
                    if room in self.rooms:
                        self.rooms[room].discard(sid)
                        if not self.rooms[room]:  # Remove empty rooms
                            del self.rooms[room]
                
                # Remove connection
                del self.connections[sid]
        
        @self.sio.event
        async def subscribe(sid, data):
            """Subscribe client to rooms"""
            try:
                rooms = data.get("rooms", [])
                if not isinstance(rooms, list):
                    rooms = [rooms]
                
                for room in rooms:
                    await self.add_to_room(sid, room)
                
                await self.sio.emit("subscribed", {
                    "rooms": rooms,
                    "timestamp": datetime.utcnow().isoformat()
                }, room=sid)
                
                logger.info(f"Client {sid} subscribed to rooms: {rooms}")
                
            except Exception as e:
                logger.error(f"Error subscribing client {sid}: {e}")
                await self.sio.emit("error", {
                    "message": "Subscription failed",
                    "error": str(e)
                }, room=sid)
        
        @self.sio.event
        async def unsubscribe(sid, data):
            """Unsubscribe client from rooms"""
            try:
                rooms = data.get("rooms", [])
                if not isinstance(rooms, list):
                    rooms = [rooms]
                
                for room in rooms:
                    await self.remove_from_room(sid, room)
                
                await self.sio.emit("unsubscribed", {
                    "rooms": rooms,
                    "timestamp": datetime.utcnow().isoformat()
                }, room=sid)
                
                logger.info(f"Client {sid} unsubscribed from rooms: {rooms}")
                
            except Exception as e:
                logger.error(f"Error unsubscribing client {sid}: {e}")
        
        @self.sio.event
        async def message(sid, data):
            """Handle client messages"""
            logger.info(f"Message from {sid}: {data}")
            
            # Echo back for now (can be extended for chat, etc.)
            await self.sio.emit("message", {
                "from": sid,
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            }, room=sid)
        
        @self.sio.event
        async def ping(sid, data):
            """Handle ping for connection health check"""
            await self.sio.emit("pong", {
                "timestamp": datetime.utcnow().isoformat()
            }, room=sid)
    
    async def add_to_room(self, sid: str, room: str):
        """Add client to a room"""
        await self.sio.enter_room(sid, room)
        
        # Track in our internal structures
        if room not in self.rooms:
            self.rooms[room] = set()
        self.rooms[room].add(sid)
        
        if sid in self.connections:
            self.connections[sid]["rooms"].add(room)
    
    async def remove_from_room(self, sid: str, room: str):
        """Remove client from a room"""
        await self.sio.leave_room(sid, room)
        
        # Remove from internal tracking
        if room in self.rooms:
            self.rooms[room].discard(sid)
            if not self.rooms[room]:
                del self.rooms[room]
        
        if sid in self.connections:
            self.connections[sid]["rooms"].discard(room)
    
    async def broadcast_to_room(self, room: str, data: Dict[str, Any]):
        """Broadcast message to all clients in a room"""
        if room in self.rooms and self.rooms[room]:
            try:
                await self.sio.emit("dashboard:update", data, room=room)
                logger.debug(f"Broadcasted to room {room}: {len(self.rooms[room])} clients")
            except Exception as e:
                logger.error(f"Error broadcasting to room {room}: {e}")
    
    async def send_to_client(self, sid: str, event: str, data: Dict[str, Any]):
        """Send message to specific client"""
        try:
            await self.sio.emit(event, data, room=sid)
        except Exception as e:
            logger.error(f"Error sending to client {sid}: {e}")
    
    async def broadcast_to_all(self, event: str, data: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        try:
            await self.sio.emit(event, data)
            logger.debug(f"Broadcasted {event} to all clients")
        except Exception as e:
            logger.error(f"Error broadcasting to all clients: {e}")
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        return {
            "total_connections": len(self.connections),
            "total_rooms": len(self.rooms),
            "rooms": {room: len(clients) for room, clients in self.rooms.items()},
            "connections": {
                sid: {
                    "connected_at": conn["connected_at"],
                    "rooms": list(conn["rooms"]),
                    "ip_address": conn["ip_address"]
                } 
                for sid, conn in self.connections.items()
            }
        }
    
    def get_room_clients(self, room: str) -> Set[str]:
        """Get clients in a specific room"""
        return self.rooms.get(room, set()).copy()
    
    async def start(self):
        """Start the WebSocket server"""
        try:
            config = uvicorn.Config(
                self.app,
                host="0.0.0.0",
                port=settings.WEBSOCKET_PORT,
                log_level="info"
            )
            self.server = uvicorn.Server(config)
            
            # Run server in background task
            asyncio.create_task(self.server.serve())
            logger.info(f"WebSocket server started on port {settings.WEBSOCKET_PORT}")
            
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {e}")
            raise
    
    async def stop(self):
        """Stop the WebSocket server"""
        try:
            if self.server:
                self.server.should_exit = True
                await self.server.shutdown()
            logger.info("WebSocket server stopped")
        except Exception as e:
            logger.error(f"Error stopping WebSocket server: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """WebSocket server health check"""
        return {
            "status": "healthy",
            "connections": len(self.connections),
            "rooms": len(self.rooms),
            "server_running": self.server is not None,
            "timestamp": datetime.utcnow().isoformat()
        }