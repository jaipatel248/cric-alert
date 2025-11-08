# Cricket Alert Monitor 🏏

A real-time cricket match monitoring system that sends alerts based on custom user-defined conditions using natural language processing.

## Features

- **Natural Language Alerts**: Define alerts in plain English
- **Real-time Monitoring**: Continuously polls live cricket commentary
- **Adaptive Polling**: Adjusts check frequency based on match activity
- **Multiple Alert Types**:
  - Player milestones (50s, 100s, custom scores)
  - Team targets (score thresholds, leads)
  - Bowling milestones (wickets, economy rate)
  - Event triggers (wickets, player debuts)
- **REST API**: Full-featured FastAPI backend
- **Auto Documentation**: Swagger UI and ReDoc

## Project Structure

```
cric--alert/
├── backend/          # FastAPI REST API
│   ├── .venv/        # Virtual environment (local)
│   ├── app/          # Application code
│   ├── prompts/      # AI prompts
│   ├── .env          # Environment variables
│   └── README.md     # Backend docs
│
├── frontend/         # Frontend (Coming soon)
│   └── README.md
│
└── README.md         # This file
```

## Quick Start

### Prerequisites

- Python 3.8+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Setup

```bash
# 1. Clone repository
git clone https://github.com/jaipatel248/cric--alert.git
cd cric--alert

# 2. Setup backend
cd backend

# 3. Run quick start script (creates venv, installs deps, starts server)
chmod +x start.sh
./start.sh
```

The script will:
- Create a `.venv` virtual environment in the backend folder
- Install dependencies
- Prompt you to create `.env` file with your GEMINI_API_KEY
- Start the FastAPI server

### Manual Setup

If you prefer manual setup:

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run server
python run.py
```



## API Access## Architecture



Once running, access:### Components

- **API**: http://localhost:8000

- **Swagger Docs**: http://localhost:8000/docs- **`main.py`**: Main application loop and user interaction

- **ReDoc**: http://localhost:8000/redoc- **`api_client.py`**: Cricbuzz API client for fetching live data

- **`gemini_client.py`**: Gemini API integration for NLP

## Example Usage- **`watcher.py`**: Alert evaluation engine

- **`scheduler.py`**: Adaptive polling scheduler

### Create an Alert- **`prompts/`**: System and user prompt templates



```bash### How It Works

curl -X POST http://localhost:8000/api/v1/alerts \

  -H "Content-Type: application/json" \1. **User Input**: Natural language alert is parsed by Gemini into structured rules

  -d '{2. **Polling**: System fetches live commentary at adaptive intervals

    "match_id": 119888,3. **Evaluation**: Gemini evaluates rules against live data using the watcher prompts

    "alert_text": "Notify me when Virat Kohli is within 5 runs of a century"4. **Alerts**: Matching conditions trigger notifications in the terminal

  }'5. **State Management**: In-memory state prevents duplicate alerts

```

## Alert Examples

### Get Match Status

### Player Milestones

```bash```

curl http://localhost:8000/api/v1/matches/119888Notify me when Rishabh Pant is within 5 runs of a fifty or century

``````



### List All Alerts### Team Targets

```

```bashAlert when India crosses 200 runs or when they lead by 100

curl http://localhost:8000/api/v1/alerts```

```

### Bowling Alerts

## Finding Match IDs```

Tell me when any bowler takes 5 wickets

1. Visit [Cricbuzz Live Scores](https://www.cricbuzz.com/cricket-match/live-scores)```

2. Click any live match

3. Extract ID from URL:### Event Triggers

   ``````

   https://www.cricbuzz.com/live-cricket-scores/119888/...Alert on every wicket

                                                 ^^^^^^ Match ID```

   ```

## Configuration

## Example Alerts

Edit these values in `scheduler.py`:

### Player Milestones- `default_interval`: Default polling interval (60 seconds)

- "Notify me when Virat Kohli is within 5 runs of a century"- `min_interval`: Minimum polling interval (10 seconds)

- "Alert when Rohit Sharma reaches 50 runs"- `max_interval`: Maximum polling interval (300 seconds)



### Team Targets## Limitations

- "Alert when India crosses 200 runs"

- "Tell me when Australia leads by 100"- In-memory only (state resets on restart)

- Terminal notifications only (no push/email)

### Bowling- Single match at a time

- "Alert when Bumrah takes 5 wickets"- Requires active internet connection

- "Notify when economy rate goes below 3"

## Future Enhancements

### Events

- "Alert on every wicket"- Database persistence

- "Tell me when a new batter comes in"- Multiple match monitoring

- Push notifications (Telegram, Discord, Email)

## Technology Stack- Web dashboard

- Match recommendation system

- **Backend**: FastAPI, Python 3.12, Uvicorn

- **AI**: Google Gemini## License

- **Data**: Cricbuzz API

- **Frontend**: Coming soon (React/Next.js)MIT



## Documentation## Acknowledgments



- [Backend Documentation](./backend/README.md)- Live data from Cricbuzz API

- [Frontend Documentation](./frontend/README.md)- NLP powered by Google Gemini
- [API Docs](http://localhost:8000/docs) (when running)

## Development

### Backend

```bash
cd backend
python test_setup.py    # Test setup
python run.py           # Run server
```

### Frontend

Coming soon!

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

## Roadmap

- [x] Backend API with FastAPI
- [x] Natural language parsing
- [x] Real-time monitoring
- [x] Multiple alert types
- [ ] Frontend dashboard
- [ ] WebSocket support
- [ ] Database persistence
- [ ] Authentication
- [ ] Push notifications
- [ ] Mobile app

## License

MIT

## Acknowledgments

- Data: [Cricbuzz](https://www.cricbuzz.com)
- AI: [Google Gemini](https://ai.google.dev/)
- Framework: [FastAPI](https://fastapi.tiangolo.com/)

---

**Made with ❤️ for cricket fans worldwide** 🏏
