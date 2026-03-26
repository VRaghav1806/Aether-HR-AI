from fastapi import FastAPI, WebSocket, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uuid
import os
import sys
import asyncio

# Ensure current directory is in path for local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from schemas import Ticket, AgentStatus
from agents import AgentOrchestrator

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
