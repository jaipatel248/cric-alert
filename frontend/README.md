# Cric Alert Frontend

React + TypeScript frontend for the Cricket Alert monitoring system.

## Tech Stack

- **React 19** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Axios** for API calls

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## Environment Variables

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:8000
```

## Features

- Home page with API health status
- Match monitoring with live data
- Create custom alerts in natural language
- View and manage all active alerts
- Material-UI responsive design

## Pages

- `/` - Home page
- `/monitor` - Create new alerts
- `/alerts` - View all alerts
