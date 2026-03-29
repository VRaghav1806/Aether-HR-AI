from __future__ import annotations
import os
import motor.motor_asyncio
from typing import List, Optional, Dict, Any
from schemas import Employee, Ticket
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/aether_hr")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client.get_database()
employees_collection = db.get_collection("employees")
policies_collection = db.get_collection("policies")
expenses_collection = db.get_collection("expenses")
tickets_collection = db.get_collection("tickets")

async def get_all_employees() -> List[Employee]:
    # Automated Weekly WFH Reset Check
    await check_and_reset_weekly_counts()
    
    employees = []
    async for doc in employees_collection.find():
        doc['id'] = doc.get('id', str(doc.get('_id')))
        employees.append(Employee(**doc))
    return employees

async def check_and_reset_weekly_counts():
    cursor = employees_collection.find()
    async for emp in cursor:
        last_reset = emp.get("last_wfh_reset", datetime.now())
        if (datetime.now() - last_reset).days >= 7:
            await employees_collection.update_one(
                {"id": emp["id"]},
                {"$set": {"weekly_wfh_count": 0, "last_wfh_reset": datetime.now()}}
            )

async def increment_employee_usage(employee_id: str, type: str):
    field = "weekly_wfh_count" if type == "wfh" else "yearly_leave_count"
    await employees_collection.update_one(
        {"id": employee_id},
        {"$inc": {field: 1}}
    )

async def add_employee(employee: Employee) -> bool:
    # Check if ID or Email already exists
    existing = await employees_collection.find_one(
        {"$or": [{"id": employee.id}, {"email": employee.email}]}
    )
    if existing:
        return False
    
    await employees_collection.insert_one(employee.dict())
    return True

async def update_employee_status(employee_id: str, is_busy: bool, ticket_id: Optional[str] = None, task_status: Optional[str] = None, increment_task_count: bool = False):
    update_fields: Dict[str, Any] = {"is_busy": is_busy}
    if task_status is not None:
        update_fields["task_status"] = task_status
        
    if ticket_id is not None:
        update_fields["current_ticket_id"] = ticket_id
    else:
        # If ticket_id is None, remove the field if it exists
        await employees_collection.update_one(
            {"id": employee_id},
            {"$unset": {"current_ticket_id": ""}}
        )
    
    if increment_task_count:
        await employees_collection.update_one(
            {"id": employee_id},
            {"$set": update_fields, "$inc": {"tasks_completed_count": 1}}
        )
    else:
        await employees_collection.update_one(
            {"id": employee_id},
            {"$set": update_fields}
        )

async def get_best_employee() -> Optional[Employee]:
    # Get highest performing employee who is NOT busy (or field doesn't exist)
    doc = await employees_collection.find_one(
        {"$or": [{"is_busy": False}, {"is_busy": {"$exists": False}}]},
        sort=[("performance_score", -1)]
    )
    if doc:
        doc['id'] = doc.get('id', str(doc.get('_id')))
        return Employee(**doc)
    return None

async def get_all_policies() -> List[dict]:
    policies = []
    async for doc in policies_collection.find():
        doc['_id'] = str(doc['_id'])
        policies.append(doc)
    return policies

async def add_policy(policy: dict) -> bool:
    await policies_collection.insert_one(policy)
    return True

async def update_policy(policy_id: str, policy_data: dict) -> bool:
    result = await policies_collection.update_one(
        {"id": policy_id},
        {"$set": policy_data}
    )
    return result.modified_count > 0

async def delete_policy(policy_id: str) -> bool:
    result = await policies_collection.delete_one({"id": policy_id})
    return result.deleted_count > 0

async def get_all_expenses() -> List[dict]:
    expenses = []
    async for doc in expenses_collection.find():
        doc['_id'] = str(doc['_id'])
        expenses.append(doc)
    return expenses

async def get_all_tickets() -> List[Ticket]:
    tickets = []
    async for doc in tickets_collection.find():
        doc.pop('_id', None)
        tickets.append(Ticket(**doc))
    return tickets

async def save_ticket(ticket: Ticket):
    await tickets_collection.update_one(
        {"id": ticket.id},
        {"$set": ticket.dict()},
        upsert=True
    )

async def seed_enterprise_data():
    # Only seed if collections are empty
    if await policies_collection.count_documents({}) == 0:
        await policies_collection.insert_many([
            { 
                "id": "POL-001", 
                "title": "Work From Home Policy", 
                "category": "General", 
                "description": "Employees are eligible for up to 2 days of remote work per week. Requests must be submitted 24 hours in advance and approved by the department lead.",
                "status": "Active", 
                "updated": "2026-03-15", 
                "coverage": "98%" 
            },
            { 
                "id": "POL-002", 
                "title": "Maternity & Paternity Leave", 
                "category": "Benefits", 
                "description": "Company provides 16 weeks of fully paid maternity leave and 4 weeks of paternity leave. Documentation from a medical professional is required for formal processing.",
                "status": "Active", 
                "updated": "2026-01-10", 
                "coverage": "100%" 
            },
            { 
                "id": "POL-003", 
                "title": "Annual Bonus Structure", 
                "category": "Compensation", 
                "description": "Performance bonuses are calculated based on Elite Staff metrics. Employees with scores > 95 receive a 15% bonus, scores 80-95 receive 10%, and scores < 80 receive 5%.",
                "status": "Under Review", 
                "updated": "2026-03-20", 
                "coverage": "85%" 
            },
            { 
                "id": "POL-004", 
                "title": "Hardware & Equipment Refresh", 
                "category": "General", 
                "description": "Standard company laptops (EliteBook or MacBook Pro) are eligible for a refresh every 3 years. Damaged equipment should be reported to the IT AI-Gate within 24 hours.",
                "status": "Active", 
                "updated": "2026-03-22", 
                "coverage": "99%" 
            },
            { 
                "id": "POL-005", 
                "title": "Global Travel Policy", 
                "category": "Compensation", 
                "description": "Business travel must be booked via the Aether portal. Flights under 6 hours are restricted to Economy; over 6 hours are eligible for Business. Daily per-diem is capped at $75.",
                "status": "Active", 
                "updated": "2026-02-15", 
                "coverage": "92%" 
            },
            { 
                "id": "POL-006", 
                "title": "Workplace Safety & AI Monitoring", 
                "category": "Safety", 
                "description": "Warehouse and office floor safety is monitored by Aether Vision. PPE is mandatory in designated zones. Non-compliance results in automatic safety flagging and mandatory re-training.",
                "status": "Active", 
                "updated": "2026-03-25", 
                "coverage": "100%" 
            },
            { 
                "id": "POL-007", 
                "title": "Sick Leave Policy", 
                "category": "Benefits", 
                "description": "Employees are entitled to 12 days of paid sick leave per year. For absences exceeding 3 consecutive days, a valid medical certificate from a registered practitioner must be submitted to HR.",
                "status": "Active", 
                "updated": "2026-03-28", 
                "coverage": "100%" 
            },
            { 
                "id": "POL-008", 
                "title": "Casual Leave Framework", 
                "category": "Benefits", 
                "description": "Up to 10 days of casual leave are provided annually for personal exigencies. A maximum of 3 days can be taken consecutively. Prior approval is mandatory except in emergencies.",
                "status": "Active", 
                "updated": "2026-03-28", 
                "coverage": "95%" 
            },
            { 
                "id": "POL-009", 
                "title": "Privilege/Earned Leave", 
                "category": "Benefits", 
                "description": "Employees accrue 20 days of privilege leave per year. Requests must be submitted at least 14 days in advance via the Aether portal and approved by the department manager.",
                "status": "Active", 
                "updated": "2026-03-28", 
                "coverage": "90%" 
            },
            { 
                "id": "POL-010", 
                "title": "Autonomous Task Allocation", 
                "category": "General", 
                "description": "HR tasks and work emails are automatically routed to the most qualified available employee. Qualification is determined by Elite Staff performance scores (>85), provided the employee is NOT currently assigned to another critical ticket.",
                "status": "Active", 
                "updated": "2026-03-28", 
                "coverage": "100%" 
            },
            { 
                "id": "POL-011", 
                "title": "Software & UI Support Services", 
                "category": "General", 
                "description": "Technical requests including landing page updates, UI bug fixes, and software feature enhancements are valid work items. AI should acknowledge these requests and route them to the technical staff with relevant performance scores for execution.",
                "status": "Active", 
                "updated": "2026-03-28", 
                "coverage": "95%" 
            },
            { 
                "id": "POL-012", 
                "title": "AI-Driven Task Assignment & Performance Policy", 
                "category": "General", 
                "description": "If any work or task is given to HR through mail it should be assigned to an employee by AI by considering the performance of the employee. The system prioritizes employees with the highest performance scores to ensure excellence in task execution.",
                "status": "Active", 
                "updated": "2026-03-29", 
                "coverage": "100%" 
            }
        ])

    if await employees_collection.count_documents({}) == 0:
        await employees_collection.insert_many([
            { "id": "EMP-001", "name": "Saai Rahul", "performance_score": 92.5, "email": "saairahul2004@gmail.com", "is_busy": False, "yearly_leave_count": 5, "weekly_wfh_count": 1, "last_wfh_reset": datetime.now() },
            { "id": "EMP-002", "name": "Aiswarya", "performance_score": 88.0, "email": "aiswarya@example.com", "is_busy": False, "yearly_leave_count": 2, "weekly_wfh_count": 0, "last_wfh_reset": datetime.now() },
            { "id": "EMP-003", "name": "Raghav", "performance_score": 95.0, "email": "raghav@example.com", "is_busy": False, "yearly_leave_count": 8, "weekly_wfh_count": 2, "last_wfh_reset": datetime.now() }
        ])

    if await expenses_collection.count_documents({}) == 0:
        await expenses_collection.insert_many([
            { "id": "EXP-101", "employee": "Elena Smith", "amount": "$1,250.00", "category": "Training", "risk": "Low", "aiAdvice": "Aligns with EDU-202 policy. Recommend Approval." },
            { "id": "EXP-102", "employee": "Marcus Vane", "amount": "$45.00", "category": "Travel", "risk": "Low", "aiAdvice": "Within daily allowance. Recommend Approval." }
        ])
