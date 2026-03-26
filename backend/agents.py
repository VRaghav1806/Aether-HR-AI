import os
import sys
import asyncio
from datetime import datetime
from typing import List, Dict

# Ensure current directory is in path for local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from schemas import AgentStatus, Ticket
from integrations import MailClient
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

# For demonstration, we'll use a mock LLM if no API key is found
class MockLLM:
    async def invoke(self, prompt: str) -> str:
        await asyncio.sleep(1)
        if "classify" in prompt.lower():
            return "billing"
        elif "solution" in prompt.lower():
            return "Generated a reset link for the user."
        return "Acknowledged."

class AetherAgent:
    def __init__(self, agent_id: str, name: str, agent_type: str):
        self.status = AgentStatus(id=agent_id, name=name, type=agent_type, status="idle")
        self.llm = ChatOpenAI(model="gpt-3.5-turbo") if os.getenv("OPENAI_API_KEY") else MockLLM()

    async def process(self, ticket: Ticket) -> Dict:
        self.status.status = "busy"
        self.status.last_action = f"Analyzing Inbound Mail: {ticket.id}"
        
        # Simulate agent thinking
        await asyncio.sleep(2)
        
        result = {"agent": self.name, "action": "processed"}
        
        if self.type == "Talent":
            # Segregation logic
            content_lower = ticket.content.lower()
            if "leave" in content_lower or "vacation" in content_lower or "off" in content_lower:
                ticket.category = "Leave Request"
            elif "salary" in content_lower or "payroll" in content_lower or "pay" in content_lower:
                ticket.category = "Payroll/Compensation"
            elif "job" in content_lower or "hiring" in content_lower or "onboard" in content_lower:
                ticket.category = "Talent/Recruitment"
            else:
                ticket.category = "General Inquiry"
            
            result["output"] = f"Segregated mail into: {ticket.category}"
            
        elif self.type == "Policy":
            if ticket.category == "Leave Request":
                result["output"] = "Policy Eval: Leave eligibility confirmed (Balance: 15.5 days). APPROVED."
            else:
                result["output"] = f"Policy Eval: No specific constraints for {ticket.category}."
                
        elif self.type == "Payroll":
            if ticket.category == "Leave Request":
                result["output"] = "Auto-Reply: Sent approval notification and updated calendar."
            else:
                result["output"] = "Action: Routed to manual review queue."

        self.status.status = "idle"
        self.status.last_action = "Awaiting next mail"
        return result

    @property
    def id(self): return self.status.id
    @property
    def name(self): return self.status.name
    @property
    def type(self): return self.status.type

class AgentOrchestrator:
    def __init__(self):
        self.agents = [
            AetherAgent("agent_talent", "Talent-1", "Talent"),
            AetherAgent("agent_policy", "Policy-2", "Policy"),
            AetherAgent("agent_payroll", "Payroll-3", "Payroll")
        ]
        self.tickets: List[Ticket] = []
        self.mail_client = MailClient()

    def get_agent_statuses(self) -> List[AgentStatus]:
        return [a.status for a in self.agents]

    async def poll_real_emails(self):
        """Task to check for real emails and inject them into the system."""
        new_mails = self.mail_client.get_new_emails()
        for mail in new_mails:
            # Check if we already processed this ID (naive check)
            if any(t.source == mail["id"] for t in self.tickets):
                continue
                
            ticket = Ticket(
                id=mail["id"],
                source=mail["sender"],
                content=f"Subject: {mail['subject']}\nContent: {mail['content']}"
            )
            self.tickets.append(ticket)
            asyncio.create_task(self.resolve_ticket(ticket.id))

    async def resolve_ticket(self, ticket_id: str):
        # find ticket
        ticket = next((t for t in self.tickets if t.id == ticket_id), None)
        if not ticket: return
        
        ticket.status = "processing"
        
        for agent in self.agents:
            res = await agent.process(ticket)
            ticket.history.append({
                "timestamp": datetime.now().isoformat(),
                "agent": agent.name,
                "action": res["output"]
            })
            
            # If it's the last agent and a reply was generated, send it
            if agent.type == "Payroll" and "Auto-Reply" in res["output"]:
                self.mail_client.send_reply(
                    to_email=ticket.source, 
                    subject="HR Request Update", 
                    body=f"Hello, \n\n{res['output']}\n\nBest regards,\nAether HR-AI"
                )
            await asyncio.sleep(1)
            
        ticket.status = "resolved"
