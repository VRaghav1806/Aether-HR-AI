from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class AgentStatus(BaseModel):
    id: str
    name: str
    type: str # 'email', 'decision', 'response'
    status: str # 'idle', 'busy', 'error'
    last_action: Optional[str] = None
    last_update: datetime = Field(default_factory=datetime.now)

class Ticket(BaseModel):
    id: str
    source: str
    content: str
    category: Optional[str] = None
    priority: Optional[str] = None
    assigned_agent: Optional[str] = None
    status: str = "pending" # 'pending', 'processing', 'resolved'
    history: List[Dict[str, Any]] = []

class AgentAction(BaseModel):
    agent_id: str
    action: str
    data: Optional[Dict[str, Any]] = None
