from fastapi import FastAPI, WebSocket, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uuid
import os
import sys
import asyncio

# Ensure current directory is in path for local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from schemas import Ticket, AgentStatus, Employee, Policy, Expense
from agents import AgentOrchestrator
import database

app = FastAPI(title="Aether Agentic OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = AgentOrchestrator()

@app.on_event("startup")
async def startup_event():
    # Seed mock data for new features if collections are empty
    await database.seed_enterprise_data()
    # Start the background email polling loop
    asyncio.create_task(email_polling_loop())

async def email_polling_loop():
    while True:
        try:
            await orchestrator.poll_real_emails()
        except Exception as e:
            print(f"Polling Error: {e}")
        await asyncio.sleep(60) # Poll every minute

@app.get("/status")
async def get_status():
    return {
        "agents": orchestrator.get_agent_statuses(),
        "total_tickets": len(orchestrator.tickets),
        "resolved": len([t for t in orchestrator.tickets if t.status == "resolved"]),
        "mail_connected": orchestrator.mail_client.is_configured(),
        "mail_error": orchestrator.mail_client.last_error
    }

@app.post("/tickets", response_model=Ticket)
async def create_ticket(content: str, background_tasks: BackgroundTasks):
    ticket = Ticket(
        id=str(uuid.uuid4())[:8],
        source="dashboard",
        content=content
    )
    orchestrator.tickets.append(ticket)
    background_tasks.add_task(orchestrator.resolve_ticket, ticket.id)
    return ticket

@app.get("/tickets", response_model=List[Ticket])
async def list_tickets():
    return orchestrator.tickets

@app.get("/employees", response_model=List[Employee])
async def list_employees():
    return await database.get_all_employees()

@app.post("/employees", response_model=Employee)
async def create_employee(employee: Employee):
    success = await database.add_employee(employee)
    if not success:
        raise HTTPException(status_code=400, detail="Employee ID or Email already exists")
    return employee

@app.get("/analytics")
async def get_analytics():
    categories = {}
    for t in orchestrator.tickets:
        cat = t.category or "Uncategorized"
        categories[cat] = categories.get(cat, 0) + 1
    
    return {
        "categories": categories,
        "time_saved_hours": len(orchestrator.tickets) * 0.5, # Assume 30 mins saved per ticket
        "efficiency_score": 98.4 if len(orchestrator.tickets) > 0 else 0,
        "agent_performance": [
            {"name": "Talent-1", "accuracy": 99.2, "load": "Low"},
            {"name": "Policy-2", "accuracy": 98.5, "load": "Medium"},
            {"name": "Payroll-3", "accuracy": 97.8, "load": "Low"}
        ]
    }

@app.get("/policies", response_model=List[Policy])
async def list_policies():
    return await database.get_all_policies()

@app.post("/policies", response_model=Policy)
async def create_policy(policy: Policy):
    await database.add_policy(policy.dict())
    return policy

@app.put("/policies/{policy_id}")
async def update_policy(policy_id: str, policy: Policy):
    success = await database.update_policy(policy_id, policy.dict())
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"status": "success"}

@app.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str):
    success = await database.delete_policy(policy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"status": "success"}

@app.get("/expenses", response_model=List[Expense])
async def list_expenses():
    return await database.get_all_expenses()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
