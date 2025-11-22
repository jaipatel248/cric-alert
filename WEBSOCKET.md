# WebSocket Implementation

## Overview

Real-time alert updates using WebSocket connections between frontend and backend.

## Backend

### WebSocket Manager (`app/services/websocket_manager.py`)
- Manages active WebSocket connections per monitor
- Broadcasts messages to specific monitors or all connections
- Handles connection/disconnection cleanup

### WebSocket Endpoint (`app/api/routes/websocket.py`)
- **Endpoint**: `ws://localhost:8000/api/v1/ws/{monitor_id}`
- Accepts WebSocket connections for specific monitors
- Sends initial monitor state on connection
- Supports ping/pong for keepalive
- Supports "refresh" command to get current state

### Message Types Sent from Backend

1. **monitor_update** - Full monitor state update
   ```json
   {
     "type": "monitor_update",
     "data": { /* AlertMonitor object */ }
   }
   ```

2. **new_alert** - New alert triggered
   ```json
   {
     "type": "new_alert",
     "data": {
       "monitor_id": "string",
       "alert": { /* RecentAlert object */ }
     }
   }
   ```

3. **status_change** - Monitor status changed
   ```json
   {
     "type": "status_change",
     "data": {
       "monitor_id": "string",
       "status": "monitoring|approaching|imminent|triggered|aborted|stopped|error",
       "running": true|false
     }
   }
   ```

4. **expected_next_check_update** - Next check estimation updated
   ```json
   {
     "type": "expected_next_check_update",
     "data": {
       "monitor_id": "string",
       "expectedNextCheck": { /* ExpectedNextCheck object */ }
     }
   }
   ```

## Frontend

### WebSocket Hook (`hooks/useWebSocket.ts`)
- Custom React hook for WebSocket connections
- Auto-reconnection with exponential backoff (up to 5 attempts)
- Connection state management
- Message handling with callbacks

### Usage in AlertDetail

```typescript
const { isConnected } = useWebSocket(monitorId, {
  onMessage: (message) => {
    // Handle real-time updates
    switch (message.type) {
      case 'new_alert':
        // Update monitor with new alert
        break;
      case 'status_change':
        // Update monitor status
        break;
      // ... etc
    }
  },
  onConnect: () => console.log('Connected'),
  onDisconnect: () => console.log('Disconnected'),
});
```

### Connection Status Indicator
- "Live" chip shown when WebSocket is connected
- "Disconnected" chip when connection is lost
- Automatic reconnection attempts

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=localhost:8000
```

**Note**: `REACT_APP_WS_URL` should NOT include protocol (ws:// or wss://)
- Protocol is auto-detected based on page protocol (http → ws, https → wss)

## Benefits

1. **Real-time Updates**: Instant alert notifications without polling
2. **Reduced Server Load**: No repeated HTTP requests for status checks
3. **Better UX**: Immediate feedback when alerts trigger
4. **Efficient**: WebSocket keeps single persistent connection
5. **Reliable**: Auto-reconnection on disconnect

## Testing

1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm start`
3. Create a monitor and navigate to its detail page
4. Check console for WebSocket connection logs
5. Monitor should receive real-time updates when alerts trigger
6. "Live" indicator should show connection status

## Migration from Polling

**Before**: AlertDetail polled `/api/v1/alerts/{id}` every 30 seconds

**After**: 
- Initial fetch on mount
- WebSocket connection for real-time updates
- Manual refresh button available if needed
- Fallback to HTTP API if WebSocket unavailable
