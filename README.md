# Method Service Health Check Dashboard

A local development tool for monitoring Method microservices health status and performing automated troubleshooting operations.

## Features

- **Real-time Monitoring**: Auto-refreshes every 30 seconds to check service health
- **Multi-Format Support**: Handles 3 different health check response formats
- **Visual Dashboard**: Color-coded status indicators and dependency details
- **Automated Troubleshooting**: One-click execution of common fixes
- **Command Execution**: Supports Redis cache clearing, IIS restarts, and custom commands

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Vite + Tailwind CSS
- **State Management**: React Query (with auto-polling)

## Prerequisites

- Node.js 18+ installed
- Access to Method local services (*.methodlocal.com domains)
- Admin privileges for IIS and service management commands
- Redis CLI installed (for cache clearing)

## Installation

### 1. Clone or navigate to the project directory
```bash
cd C:\MethodServiceCheck
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

## Running the Dashboard

### Start Backend Server
```bash
cd backend
npm start
```
Backend will run on `http://localhost:3001`

### Start Frontend (in a separate terminal)
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

Open your browser to `http://localhost:5173` to view the dashboard.

## Configuration

### Adding New Services

Edit `backend/services.json`:
```json
{
  "id": "my-new-service",
  "name": "My New Service",
  "url": "https://myservice.methodlocal.com/health/check",
  "type": "status-results"  // or "dependencies" or "buildnumber-dependencies"
}
```

### Adding Troubleshooting Actions

Edit `backend/troubleshooting.json`:
```json
{
  "my-new-service": [
    {
      "id": "action-id",
      "name": "Action Name",
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "description": "What this action does",
      "requiresAdmin": true,  // optional
      "shell": true  // optional, for commands with &&
    }
  ]
}
```

## Monitored Services

The dashboard currently monitors 13 microservices:

1. MS Gateway API
2. MS Authentication API
3. MS Authentication API OAuth2
4. MS Identity API
5. MS Preferences API
6. MS Account API
7. MS Email API
8. MS Apps API
9. MS Tables Fields API
10. Legacy Authentication API
11. Method SignIn UI
12. Method SignUp UI
13. Internal Migration API

## Common Troubleshooting Commands

The dashboard includes pre-configured troubleshooting actions:

- **Clear Redis Cache**: `redis-cli FLUSHALL`
- **Restart IIS**: `iisreset /restart` (requires admin)
- **Restart RabbitMQ**: `net stop RabbitMQ && net start RabbitMQ` (requires admin)

## Running with Admin Privileges

Some troubleshooting actions require administrator privileges. To enable these:

### Option 1: Run terminals as Administrator
Right-click Command Prompt or PowerShell → "Run as administrator" → Navigate to project and start servers

### Option 2: Configure IIS for non-admin restart (not recommended for production)
Only for local development environments.

## Health Check Response Formats

The dashboard handles three different response formats:

### Format 1: Status-Results
```json
{
  "status": "Healthy",
  "results": {
    "redis": {"status": "Healthy"},
    "mongo": {"status": "Healthy"}
  }
}
```

### Format 2: Dependencies Array
```json
{
  "Build": "1",
  "Release": "17.18.0.2",
  "Dependencies": [
    {
      "DependencyName": "Redis",
      "DependencyStatus": "Success"
    }
  ]
}
```

### Format 3: BuildNumber-Dependencies
```json
{
  "BuildNumber": "1",
  "BuildRelease": "17.18.0.2",
  "Dependencies": [...]
}
```

## Project Structure

```
MethodServiceCheck/
├── backend/
│   ├── server.js              # Express API server
│   ├── services.json          # Service configurations
│   ├── troubleshooting.json   # Troubleshooting commands
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main component
│   │   ├── components/
│   │   │   ├── Header.jsx     # Dashboard header
│   │   │   ├── Stats.jsx      # Statistics cards
│   │   │   └── ServiceCard.jsx # Individual service card
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── claude.md                  # Context for Claude Code
└── README.md                  # This file
```

## API Endpoints

### GET /api/services
Returns all services with their current health status

### GET /api/services/:serviceId
Returns health status for a specific service

### GET /api/troubleshooting/:serviceId
Returns available troubleshooting actions for a service

### POST /api/troubleshoot/:serviceId/:actionId
Executes a troubleshooting action

### POST /api/troubleshoot/custom
Executes a custom command (body: `{command, args, serviceId}`)

### GET /api/health
Backend server health check

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses Node's --watch flag for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Building for Production
```bash
cd frontend
npm run build
```

## Troubleshooting

### Services showing as "error"
- Check if the service URLs are accessible from your machine
- Verify DNS resolution for *.methodlocal.com domains
- Check if services are running in your local environment

### Troubleshooting commands fail
- Ensure you're running with administrator privileges
- Verify Redis CLI is installed and in PATH
- Check that services like RabbitMQ are installed

### Backend won't start
- Check if port 3001 is already in use
- Verify Node.js version (18+)
- Check backend/services.json is valid JSON

### Frontend won't start
- Check if port 5173 is already in use
- Delete node_modules and run `npm install` again
- Clear Vite cache: `rm -rf node_modules/.vite`

## Security Notes

- This tool is designed for **local development only**
- No authentication is implemented
- Commands execute with the Node.js process permissions
- Admin commands require elevated privileges
- Do not expose this dashboard to network access

## Future Enhancements

- Historical health data and trends
- Alert notifications for status changes
- Configurable auto-remediation
- Health check response time metrics
- Export health reports
- Custom command templates
- Slack/Teams notifications

## Contributing

This is an internal tool for Method development. To add features:

1. Update backend/server.js for API changes
2. Update React components for UI changes
3. Update backend/services.json for new services
4. Update backend/troubleshooting.json for new actions
5. Update claude.md for context changes

## License

Internal use only - Method Development Team
