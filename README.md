# Method Health Check Dashboard

A comprehensive health monitoring dashboard for Method's microservices running locally. Monitor 15 services, view Git branches, perform actions like clearing Redis cache and rebuilding runtime-core, all from a single interface.

## Features

- **Real-time Health Monitoring** - Monitor 15 microservices with 5-minute auto-refresh
- **Git Integration** - View current branch for each repo with links to GitHub and Jira tickets
- **Quick Actions** - Clear Redis cache and rebuild runtime-core directly from the dashboard
- **Dependency Tracking** - View service dependencies and their health status
- **Smart Branch Linking** - Automatically extracts Jira ticket numbers (PL-#####) from branch names
- **IIS Hosting** - Auto-starts with Windows, no manual npm start needed

## Quick Start

### Production Mode (Recommended)

Just double-click `start-dashboard.bat` - that's it!

The launcher will:
- Auto-install dependencies if needed
- Auto-build frontend if not already built
- Start the Node.js server in a visible terminal window
- Automatically open http://localhost:3001 in your browser

**Management:**
- **Start**: Double-click `start-dashboard.bat`
- **Stop**: Close the terminal window
- **Rebuild after changes**: Double-click `build-dashboard.bat`, then restart
- **Auto-start with Windows**: Create shortcut to `start-dashboard.bat` in Startup folder (`Win+R` → `shell:startup`)

Access at: http://localhost:3001

**Why not IIS?** The dashboard controls IIS (stops/starts for runtime-core rebuild), so hosting it on IIS would cause it to kill itself.

### Development Mode (For Active Development)

Double-click `develop-dashboard.bat` for hot reload!

This starts:
- **Backend** with auto-restart on file changes (using Node.js `--watch`)
- **Frontend** with hot module replacement (using Vite dev server)

Changes appear instantly without manual rebuilds. Two terminal windows will open - close both to stop.

Access at: http://localhost:5173 (frontend dev server)

## Architecture

- **Backend**: Node.js + Express serving both API and static frontend
- **Frontend**: React + Vite + Tailwind CSS + React Query
- **Hosting**: Batch file launcher (production) or Node.js directly (development)

## Configuration

### Monitored Services (services.json)

1. runtime-core (Git only, no health check)
2. method-platform-ui (Git only, no health check)
3. ms-gateway-api
4. ms-authentication-api
5. ms-authentication-api-oauth2 (→ oauth2 repo)
6. ms-identity-api
7. ms-preferences-api
8. ms-account-api
9. ms-email-api
10. ms-apps-api
11. ms-tables-fields-api
12. legacy-authentication-api
13. method-signin-ui
14. method-signup-ui
15. internal-migration-api

### Git Repositories (git-repos.json)

Maps service IDs to local git repository paths in `C:\MethodDev\`. Special mapping: `ms-authentication-api-oauth2` → `oauth2`.

### Troubleshooting Actions (troubleshooting.json)

Currently includes RabbitMQ restart for specific services. Redis clearing and runtime-core rebuild are global actions in the UI.

## Features Detail

### Health Status
- **Healthy** (Green) - Service responding, all dependencies healthy
- **Unhealthy** (Red) - Service or dependencies failing
- **Error** (Yellow) - Cannot reach service or timeout
- **No Check** (Gray border, no badge) - Git-only repos without health checks

### Git Branch Display
- Shows current branch for each repository
- Master/main branches display in gray (non-clickable)
- Feature branches link to Jira (extracts PL-##### pattern from branch names like `origin/PL-22414-v2`)
- Repo names are underlined and link to GitHub with current branch

### Global Actions
- **Clear Redis Cache** - Executes `redis-cli -h localhost -p 6379 -c flushall`
- **Rebuild Runtime-Core** - Multi-step process with streaming progress:
  1. Stop IIS (elevated)
  2. Clean solution
  3. Build solution
  4. Restart IIS (elevated)

## Making Changes

### During Active Development
Use `develop-dashboard.bat` - changes appear instantly with hot reload. No manual rebuilds needed!

### After Making Changes (Production Mode)
1. **Frontend changes**: Run `build-dashboard.bat` to rebuild
2. **Backend changes**: No rebuild needed
3. Restart by closing terminal and running `start-dashboard.bat`

Or just use development mode to avoid this hassle!

## Troubleshooting

### Dashboard won't start
**Fix:** Check if port 3001 is already in use:
```powershell
netstat -ano | findstr :3001
```
If in use, kill the process or change the port in `backend/server.js`

### Cannot find module errors
**Fix:** Run `npm install` in the backend folder, then restart.

### Browser doesn't open automatically
**Fix:** Manually navigate to http://localhost:3001 - the server should still be running in the background.

### Dashboard unresponsive after IIS rebuild
**This is expected** - the rebuild stops/starts IIS. The dashboard runs independently and remains available throughout the rebuild process.

## Project Structure

```
MethodServiceCheck/
├── backend/
│   ├── server.js              # Express server + API routes
│   ├── services.json          # Service definitions
│   ├── git-repos.json         # Git repository mappings
│   ├── troubleshooting.json   # Troubleshooting actions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main application
│   │   ├── components/
│   │   │   ├── ServiceCard.jsx      # Service status card
│   │   │   ├── Header.jsx           # Dashboard header
│   │   │   ├── Stats.jsx            # Statistics display
│   │   │   ├── ActionButtons.jsx    # Global action buttons
│   │   │   └── RebuildModal.jsx     # Runtime-core rebuild modal
│   │   └── main.jsx
│   ├── dist/                  # Production build
│   └── package.json
├── start-dashboard.bat        # Launch production (auto-builds if needed)
├── develop-dashboard.bat      # Launch development with hot reload
├── build-dashboard.bat        # Manual build script
├── claude.md                  # Context for AI assistants
└── README.md
```

## API Endpoints

- `GET /api/services` - All services with health status and git branch info
- `GET /api/services/:serviceId` - Single service health
- `POST /api/global/clear-redis` - Clear Redis cache
- `POST /api/global/rebuild-runtime-core` - Rebuild runtime-core (streaming)
- `GET /api/health` - Dashboard health check
- `GET /*` - Serve frontend SPA (catch-all)

## Technology Stack

**Backend:**
- Express.js - Web server and API
- Node.js child_process - Command execution
- Git integration - Branch detection

**Frontend:**
- React 18 - UI framework
- Vite - Build tool and dev server
- Tailwind CSS - Utility-first styling
- React Query - Data fetching with 5-min polling
- Lucide React - Icon components

**Hosting:**
- Batch file launcher - One-click start
- Optional auto-start with Windows via startup folder

## Logs

Check the terminal window where the server is running for real-time logs. Error details will appear in the console output.

## License

Internal tool for Method CRM development team.
