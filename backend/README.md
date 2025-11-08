# Cricket Alert API - Backend

FastAPI backend for the Cricket Alert monitoring system.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   ├── api/                     # API routes
│   │   └── routes/
│   │       ├── health.py        # Health check endpoints
│   │       ├── matches.py       # Match-related endpoints
│   │       └── alerts.py        # Alert monitoring endpoints
│   ├── core/                    # Core configuration
│   │   └── config.py            # Application settings
│   ├── models/                  # Data models
│   │   └── schemas.py           # Pydantic schemas
│   ├── services/                # Business logic
│   │   ├── api_client.py        # Cricbuzz API client
│   │   ├── gemini_client.py     # Gemini AI client
│   │   ├── cricket_service.py   # Cricket data service
│   │   ├── alert_service.py     # Alert monitoring service
│   │   ├── watcher.py           # Alert watcher engine
│   │   └── scheduler.py         # Adaptive scheduler
│   └── utils/                   # Utility functions
├── prompts/                     # AI prompts
│   ├── system-prompt.md
│   └── user-prompt.md
├── run.py                       # Application runner
├── start.sh                     # Quick start script
└── requirements.txt             # Dependencies
```

## Setup

1. **Create virtual environment (in backend folder):**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   Create a `.env` file in the backend folder with:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   
   Or copy from the example:
   ```bash
   cp .env.example .env
   # Then edit .env and add your API key
   ```

## Running the API

### Quick Start (recommended):
```bash
cd backend
chmod +x start.sh
./start.sh
```
This will automatically create the virtual environment if needed and start the server.

### Development (with auto-reload):
```bash
cd backend
source .venv/bin/activate
python run.py
```

Or using uvicorn directly:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /ping` - Simple ping

### Matches
- `GET /api/v1/matches/{match_id}` - Get match status
- `GET /api/v1/matches/{match_id}/detail` - Get detailed match info
- `GET /api/v1/matches/{match_id}/active` - Check if match is active

### Alerts
- `POST /api/v1/alerts` - Create new alert monitor
- `GET /api/v1/alerts` - List all monitors
- `GET /api/v1/alerts/{monitor_id}` - Get monitor details
- `DELETE /api/v1/alerts/{monitor_id}` - Stop a monitor
- `DELETE /api/v1/alerts/{monitor_id}/delete` - Delete a monitor

## Example Usage

### Create an alert:
```bash
curl -X POST "http://localhost:8000/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": 119888,
    "alert_text": "Notify me when Virat Kohli is within 5 runs of a century"
  }'
```

### Get match status:
```bash
curl "http://localhost:8000/api/v1/matches/119888"
```

### List all alerts:
```bash
curl "http://localhost:8000/api/v1/alerts"
```

## Configuration

Edit `app/core/config.py` to customize:
- API host and port
- CORS settings
- Polling intervals
- Debug mode
