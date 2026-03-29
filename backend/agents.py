import os
import sys
import asyncio
import email.utils
from datetime import datetime
from typing import List, Dict

# Ensure current directory is in path for local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from schemas import AgentStatus, Ticket, Employee
from integrations import MailClient
import database
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
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
        
        # Use Groq if available, then OpenAI, else Mock
        if os.getenv("GROQ_API_KEY"):
            self.llm = ChatGroq(model_name="llama-3.3-70b-versatile", groq_api_key=os.getenv("GROQ_API_KEY"))
        elif os.getenv("OPENAI_API_KEY"):
            self.llm = ChatOpenAI(model="gpt-3.5-turbo")
        else:
            self.llm = MockLLM()

    async def process(self, ticket: Ticket, policies: List[dict] = [], employee_context: Dict = None) -> Dict:
        self.status.status = "busy"
        self.status.last_action = f"AI Thinking: {ticket.id}"
        
        # Format policies for the prompt
        policy_context = "\n".join([f"- {p['title']}: {p['description']}" for p in policies if p['status'] == 'Active'])
        
        # Format employee context if available
        usage_context = ""
        if employee_context:
            usage_context = f"\nEMPLOYEE USAGE DATA:\n- Yearly Leave Taken: {employee_context.get('yearly_leave_count', 0)}\n- Weekly WFH Taken: {employee_context.get('weekly_wfh_count', 0)}\n"

        prompt_tmpls = {
            "Talent": "Classify this enterprise service email into one category (Leave Request, Payroll, Software/UI Support, Data Request, Work From Home). Return ONLY the category name. Email: {content}",
            "Policy": f"Evaluate this request against all available corporate policies. \n\nACTIVE POLICIES:\n{policy_context}\n{usage_context}\n\nThe request is: {{content}}. Category: {{category}}. Decide if the request is 'APPROVABLE' or 'DENIED' based on matching policies. Provide a concise 1-sentence decision/reasoning.",
            "Payroll": "Generate a professional enterprise response for this request. Category: {category}. Content: {content}. Policy Decision: {history}. Keep it under 50 words. Do NOT use bracket placeholders like [Requester] or [Your Name]. Address them generally."
        }
        
        prompt = ChatPromptTemplate.from_template(prompt_tmpls[self.type])
        chain = prompt | self.llm
        
        try:
            response = await chain.ainvoke({
                "content": ticket.content, 
                "category": ticket.category or "Not Yet Categorized",
                "history": str(ticket.history[-1] if ticket.history else "None")
            })
            output = response.content if hasattr(response, 'content') else str(response)
        except Exception as e:
            output = f"AI Error: {str(e)}"

        if self.type == "Talent":
            ticket.category = output.strip()
            
        result = {"agent": self.name, "action": "processed", "output": output}

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
        self.first_poll_done = False
        self.initialized = False

    async def initialize(self):
        if self.initialized: return
        self.tickets = await database.get_all_tickets()
        self.initialized = True
        print(f"Orchestrator Initialized: {len(self.tickets)} historical tickets loaded.")


    def get_agent_statuses(self) -> List[AgentStatus]:
        return [a.status for a in self.agents]

    async def poll_real_emails(self):
        await self.initialize()
        new_mails = self.mail_client.get_new_emails()
        employees = await database.get_all_employees()
        
        for mail in new_mails:
            # 1. Check if we already processed this ID (do this first!)
            if any(t.id == mail["id"] for t in self.tickets):
                continue

            # 2. Check if this is a completion email from an existing employee
            employee_sender = next((e for e in employees if e.email.lower() in mail["sender"].lower()), None)
            
            if employee_sender:
                subject_lower = mail["subject"].lower()
                content_lower = mail["content"].lower()
                # If it looks like a completion email from an employee
                if any(word in subject_lower or word in content_lower for word in ["complete", "done", "resolved", "finished"]):
                    if employee_sender.is_busy:
                        await database.update_employee_status(employee_sender.id, is_busy=False, task_status="completed", increment_task_count=True)
                        print(f"Employee {employee_sender.name} marked as free and count incremented.")
                        
                        # Send acknowledgment email
                        self.mail_client.send_email(
                            to_email=employee_sender.email,
                            subject=f"Re: {mail['subject']} - Task Acknowledged",
                            body=f"Hello {employee_sender.name},\n\nOk, noted! I have updated your status on the Aether Dashboard to \"AVAILABLE\" and marked your task as \"COMPLETED\".\n\nThank you,\nAutonomous HR Orchestrator"
                        )
                        
                        if employee_sender.current_ticket_id:
                            ticket = next((t for t in self.tickets if t.id == employee_sender.current_ticket_id), None)
                            if ticket:
                                ticket.history.append({
                                    "timestamp": datetime.now().isoformat(),
                                    "agent": employee_sender.name,
                                    "action": "Task manual completion confirmed via email."
                                })
                                await database.save_ticket(ticket)
                    
                    # We must record this email as a ticket so it isn't processed again,
                    # but we mark it as resolved so the AI doesn't act on it.
                    ticket = Ticket(
                        id=mail["id"],
                        source=mail["sender"],
                        content=f"Subject: {mail['subject']}\nContent: {mail['content']}"
                    )
                    ticket.status = "resolved"
                    ticket.category = "Task Completion"
                    ticket.history.append({
                        "timestamp": datetime.now().isoformat(),
                        "agent": "System",
                        "action": f"Task completion recorded from {employee_sender.name}."
                    })
                    self.tickets.append(ticket)
                    await database.save_ticket(ticket)
                    print(f"Recorded Task Completion for {employee_sender.name}. No AI processing needed.")
                    continue
            
            # 3. Standard processing for new HR requests
            ticket = Ticket(
                id=mail["id"],
                source=mail["sender"],
                content=f"Subject: {mail['subject']}\nContent: {mail['content']}"
            )
            self.tickets.append(ticket)
            await database.save_ticket(ticket)
            
            # GUARDRAIL: Only resolve/reply if this isn't the first time we're loading history
            if self.first_poll_done:
                asyncio.create_task(self.resolve_ticket(ticket.id))
            else:
                ticket.status = "resolved"
                ticket.history.append({
                    "timestamp": datetime.now().isoformat(),
                    "agent": "System",
                    "action": "Historical record loaded (No reply sent)."
                })
                await database.save_ticket(ticket)
        
        self.first_poll_done = True

    async def resolve_ticket(self, ticket_id: str):
        # find ticket
        ticket = next((t for t in self.tickets if t.id == ticket_id), None)
        if not ticket: return
        
        print(f"--- RESOLVING TICKET: {ticket_id} ---")
        ticket.status = "processing"
        
        # Fetch latest policies and sender info to provide context
        policies = await database.get_all_policies()
        employees = await database.get_all_employees()
        sender_email = ticket.source.lower()
        sender_employee = next((e for e in employees if e.email.lower() in sender_email), None)
        
        emp_ctx = sender_employee.dict() if sender_employee else None
        
        decision_approved = False

        for agent in self.agents:
            res = await agent.process(ticket, policies=policies, employee_context=emp_ctx)
            ticket.history.append({
                "timestamp": datetime.now().isoformat(),
                "agent": agent.name,
                "action": res["output"]
            })
            await database.save_ticket(ticket)
            
            # Check if Policy agent approved specifically
            if agent.type == "Policy":
                if ("approve" in res["output"].lower() or "granted" in res["output"].lower()) and "deny" not in res["output"].lower():
                    decision_approved = True

            # The Payroll agent now generates the actual reply content
            if agent.type == "Payroll":
                print(f"PAYROLL OUTPUT for {ticket.id}: {res['output'][:100]}...")
                # Only send if it's not an AI Error
                if "AI Error" not in res["output"]:
                    # Clean the recipient email address
                    to_name, to_addr = email.utils.parseaddr(ticket.source)
                    recipient = to_addr if to_addr else ticket.source
                    
                    print(f"SMTP: Attempting to send reply to {recipient}...")
                    self.mail_client.send_reply(
                        to_email=recipient, 
                        subject=f"HR Update: {ticket.category}", 
                        body=f"{res['output']}\n\n---\nAutonomous HR Orchestrator\nAether HR-AI"
                    )
                else:
                    print(f"SMTP SKIP: AI Error detected in Payroll output for {ticket.id}.")
            await asyncio.sleep(1)
            
        # Post-Decision Logic: Increment Usage Counters if approved
        if decision_approved and sender_employee:
            if ticket.category == "Leave Request":
                await database.increment_employee_usage(sender_employee.id, "leave")
                print(f"Incremented Yearly Leave for {sender_employee.name}")
            elif ticket.category == "Work From Home":
                await database.increment_employee_usage(sender_employee.id, "wfh")
                print(f"Incremented Weekly WFH for {sender_employee.name}")

        # Selective AI Auto-Assignment: Only assign if NOT autonomously approved
        # Skip assignment for any request that was fully resolved by AI (Leave, WFH, etc.)
        best_employee = await database.get_best_employee()
        
        if decision_approved:
            ticket.history.append({
                "timestamp": datetime.now().isoformat(),
                "agent": "System",
                "action": f"Fully Autonomous {ticket.category} Approval: Decision finalized by AI Policy engine. No human assignment required."
            })
            print(f"Autonomous {ticket.category} finalized for {ticket.source}. Skipping assignment.")
        elif best_employee:
            ticket.assigned_employee_id = best_employee.id
            ticket.history.append({
                "timestamp": datetime.now().isoformat(),
                "agent": "System",
                "action": f"Assigned to {best_employee.name} (Score: {best_employee.performance_score}) following Policy POL-012: Performance-Based Task Assignment."
            })
            
            # Notify the employee via email (ONLY one email sent here if NOT approved)
            self.mail_client.send_email(
                to_email=best_employee.email,
                subject=f"New Case Assignment: {ticket.id}",
                body=f"Hello {best_employee.name},\n\nA new HR case has been assigned to you for review.\n\nCase ID: {ticket.id}\nCategory: {ticket.category}\nContent: {ticket.content[:200]}...\n\nPlease log in to the Aether Dashboard to resolve this case.\n\n---\nAutonomous HR Orchestrator"
            )
            
            # Mark the employee as busy in MongoDB
            await database.update_employee_status(best_employee.id, is_busy=True, ticket_id=ticket.id, task_status="assigned")
            
        ticket.status = "resolved"
        await database.save_ticket(ticket)
