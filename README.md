# Aether Agentic OS

Autonomous AI System with a Multi-Agent Backend (Python/LangChain) and a Premium React Dashboard.

## Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) OpenAI API Key in `backend/.env`

## How to Run

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*API will be available at http://localhost:8000*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Dashboard will be available at http://localhost:5173 (or follow the terminal output)*

## Project Structure
- `backend/`: FastAPI server, LangChain agents, Orchestrator.
- `frontend/`: React + Vite application with the Aether Obsidian design system.
