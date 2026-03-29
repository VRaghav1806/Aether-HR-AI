import requests
import time

def test_task_assignment():
    content = "We need a UI update in the software that your team made for us"
    # Create ticket
    print(f"Creating ticket: {content}")
    response = requests.post(f"http://127.0.0.1:8000/tickets?content={content}")
    if response.status_code != 200:
        print(f"Failed to create ticket: {response.text}")
        return
    
    ticket_id = response.json()["id"]
    print(f"Ticket created: {ticket_id}. Waiting for processing...")
    
    # Wait for processing (Agents take a few seconds)
    time.sleep(10)
    
    # Check ticket status and assignment
    response = requests.get("http://127.0.0.1:8000/tickets")
    tickets = response.json()
    ticket = next((t for t in tickets if t["id"] == ticket_id), None)
    
    if not ticket:
        print("Ticket not found in list.")
        return
        
    print(f"Ticket status: {ticket['status']}")
    print(f"Category: {ticket['category']}")
    print(f"Assigned Employee ID: {ticket['assigned_employee_id']}")
    
    print("\nHistory:")
    for h in ticket["history"]:
        print(f" - {h['agent']}: {h['action']}")

if __name__ == "__main__":
    test_task_assignment()
