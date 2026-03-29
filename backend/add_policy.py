import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/aether_hr")

async def add_missing_policy():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
    db = client.get_database()
    policies_collection = db.get_collection("policies")
    
    policy = { 
        "id": "POL-012", 
        "title": "AI-Driven Task Assignment & Performance Policy", 
        "category": "General", 
        "description": "If any work or task is given to HR through mail it should be assigned to an employee by AI by considering the performance of the employee. The system prioritizes employees with the highest performance scores to ensure excellence in task execution.",
        "status": "Active", 
        "updated": "2026-03-29", 
        "coverage": "100%" 
    }
    
    result = await policies_collection.update_one(
        {"id": "POL-012"},
        {"$set": policy},
        upsert=True
    )
    if result.upserted_id:
        print(f"Policy POL-012 added.")
    else:
        print(f"Policy POL-012 updated.")

if __name__ == "__main__":
    asyncio.run(add_missing_policy())
