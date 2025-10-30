# Method Service Health Check Dashboard

## Project Overview
A local development tool for monitoring microservices health status and performing automated troubleshooting operations.

## Architecture

### Stack
- **Backend**: Node.js + Express
- **Frontend**: React + Vite + Tailwind CSS
- **State Management**: React Query (auto-polling every 30s)
- **Command Execution**: Node.js child_process for Windows CLI operations

### Project Structure
```
MethodServiceCheck/
├── backend/
│   ├── server.js              # Express server
│   ├── services.json          # Service configurations
│   ├── troubleshooting.json   # Troubleshooting commands per service
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── components/        # React components
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── claude.md                  # This file
└── README.md
```

## Service Health Check Formats

The dashboard handles three different health check response formats:

### Format 1: Status-Results Pattern
Used by: ms-gateway-api, ms-authentication-api, ms-identity-api, ms-preferences-api, ms-account-api, ms-email-api, ms-apps-api
```json
{
  "status": "Healthy",
  "results": {
    "redis": {"status": "Healthy", ...},
    "mongo": {"status": "Healthy", ...}
  }
}
```

### Format 2: Dependencies Array Pattern
Used by: ms-authentication-api-oauth2, ms-tables-fields-api, legacy-authentication-api, internal-migration-api
```json
{
  "Build": "1",
  "Release": "17.18.0.2",
  "Dependencies": [
    {
      "DependencyName": "Redis Cache",
      "DependencyStatus": "Success" // or "Fail"
    }
  ]
}
```

### Format 3: BuildNumber-Dependencies Pattern
Used by: method-signin-ui, method-signup-ui
```json
{
  "BuildNumber": "1",
  "BuildRelease": "17.18.0.2",
  "Dependencies": [
    {
      "DependencyName": "SqlServer_c1",
      "DependencyStatus": "Success"
    }
  ]
}
```

## Backend API Endpoints

### GET /api/services
Returns all services with their current health status

### POST /api/troubleshoot/:serviceId
Execute troubleshooting commands for a specific service
- Requires: `serviceId` in URL
- Returns: Command execution results

### GET /api/health
Backend server health check

## Troubleshooting Commands

The system supports Windows CLI operations including:
- **Redis Cache Clear**: `redis-cli FLUSHALL`
- **IIS Service Restart**: `iisreset /restart`
- **Build & Clean**: `dotnet clean && dotnet build`
- **Execute .exe files**: Custom path execution
- **Service restart**: `net stop <service> && net start <service>`

Commands are configured per-service in `troubleshooting.json`

## Running Locally

### Backend
```bash
cd backend
npm install
npm start  # Runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

## Configuration

### Adding New Services
Edit `backend/services.json`:
```json
{
  "id": "service-name",
  "name": "Display Name",
  "url": "https://health-check-url",
  "type": "format-type"
}
```

### Adding Troubleshooting Steps
Edit `backend/troubleshooting.json`:
```json
{
  "service-id": [
    {
      "name": "Clear Redis Cache",
      "command": "redis-cli",
      "args": ["FLUSHALL"]
    }
  ]
}
```

## UI Features
- Real-time health status monitoring (auto-refresh every 30s)
- Color-coded status indicators (green=healthy, red=unhealthy, yellow=degraded)
- Expandable dependency details
- One-click troubleshooting actions
- Command execution feedback

## Security Notes
- **Local use only** - no authentication implemented
- **Requires admin privileges** for IIS restart and service management
- **Command execution** runs with Node.js process permissions

## Future Enhancements
- [ ] Historical health data and trends
- [ ] Alert notifications for status changes
- [ ] Configurable auto-remediation
- [ ] Health check response time metrics
- [ ] Export health reports
