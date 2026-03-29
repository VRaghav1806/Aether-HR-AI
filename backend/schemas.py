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

class Employee(BaseModel):
    id: str
    name: str
    performance_score: float = 0.0
    email: str
    is_busy: bool = False
    current_ticket_id: Optional[str] = None
    task_status: str = "not assigned"
    tasks_completed_count: int = 0
    yearly_leave_count: int = 0
    weekly_wfh_count: int = 0
    last_wfh_reset: datetime = Field(default_factory=datetime.now)

class Ticket(BaseModel):
    id: str
    source: str
    content: str
    category: Optional[str] = None
    priority: Optional[str] = None
    assigned_agent: Optional[str] = None
    assigned_employee_id: Optional[str] = None
    status: str = "pending" # 'pending', 'processing', 'resolved'
    history: List[Dict[str, Any]] = []

class AgentAction(BaseModel):
    agent_id: str
    action: str
    data: Optional[Dict[str, Any]] = None

class Policy(BaseModel):
    id: str
    title: str
    category: str
    description: str
    status: str
    updated: str
    coverage: str

class Expense(BaseModel):
    id: str
    employee: str
    amount: str
    category: str
    risk: str
    aiAdvice: str
