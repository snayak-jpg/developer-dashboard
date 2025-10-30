# Method Health Check Dashboard - Context for AI Assistants

## Project Overview
A local development monitoring dashboard for Method's 15 microservices with Git integration, health checking, and operational actions (Redis cache clearing, runtime-core rebuilding).

## Architecture

### Stack
- **Backend**: Node.js + Express (serves both API and static frontend)
- **Frontend**: React + Vite + Tailwind CSS
- **State Management**: React Query (5-minute auto-polling)
- **Hosting**: Batch file launcher (production) or Node.js directly (development)
- **Command Execution**: Node.js child_process for Windows operations

### Project Structure
```
MethodServiceCheck/
├── backend/
│   ├── server.js              # Express API + static file serving
│   ├── services.json          # 15 services with health check URLs
│   ├── git-repos.json         # Maps service IDs to C:\MethodDev repos
│   ├── troubleshooting.json   # RabbitMQ restart actions
│   └── package.json
├── start-dashboard.bat        # Production launcher (auto-builds if needed)
├── develop-dashboard.bat      # Development launcher (hot reload)
├── build-dashboard.bat        # Manual build script
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main component with React Query
│   │   ├── components/
│   │   │   ├── ServiceCard.jsx      # Service card with Git branch display
│   │   │   ├── Header.jsx           # "Developers Dashboard" header
│   │   │   ├── Stats.jsx            # Health statistics
│   │   │   ├── ActionButtons.jsx    # Clear Redis + Rebuild buttons
│   │   │   └── RebuildModal.jsx     # Streaming progress for rebuild
│   │   └── main.jsx
│   ├── dist/                  # Production build (npm run build)
│   └── package.json
├── claude.md                  # This file
└── README.md                  # User documentation
```

## Key Features

### 1. Health Monitoring (3 formats supported)
- **Status-Results**: `{status, results:{...}}` - Most services
- **Dependencies**: `{Dependencies:[...], Build, Release}` - OAuth2, tables-fields, etc.
- **BuildNumber-Dependencies**: `{BuildNumber, BuildRelease, Dependencies:[...]}` - UI services

### 2. Git Integration
- Displays current branch from `C:\MethodDev\{repo-name}`
- Runtime-core and method-platform-ui: Git-only (no health check)
- Special mapping: `ms-authentication-api-oauth2` → `oauth2` repo
- Repo names link to: `https://github.com/methodcrm/{repoName}/tree/{branch}`
- Branch names extract PL-##### pattern for Jira: `https://method.atlassian.net/browse/PL-#####`
- Example: Branch `origin/PL-22414-v2` displays full name, links to `PL-22414` in Jira

### 3. Global Actions
- **Clear Redis Cache**: Executes `redis-cli -h localhost -p 6379 -c flushall`
- **Rebuild Runtime-Core**: Multi-step with streaming progress:
  1. Stop IIS (PowerShell elevated)
  2. `dotnet clean C:\MethodDev\runtime-core\runtime-stack.sln`
  3. `dotnet build C:\MethodDev\runtime-core\runtime-stack.sln`
  4. Start IIS (PowerShell elevated)

### 4. Service Ordering
Services appear in this order:
1. runtime-core (no health check)
2. method-platform-ui (no health check)
3-15. Services with health checks (ms-gateway-api, ms-authentication-api, etc.)

## Important Implementation Details

### Backend (server.js)
- Serves static files from `../frontend/dist`
- `getGitBranch()`: Spawns `git rev-parse --abbrev-ref HEAD` in repo path
- `checkServiceHealth()`: Returns `status: 'no-check'` for services without URLs
- `/api/services`: Returns services with `{...service, gitBranch, repoName, hasGitRepo}`
- `repoName`: Extracted from path last segment (for GitHub links)
- `/api/global/rebuild-runtime-core`: Streaming response with progress updates
- Rebuild uses PowerShell elevation: `Start-Process iisreset -Verb RunAs -Wait`

### Frontend Components

**ServiceCard.jsx:**
- `extractJiraTicket()`: Regex `/PL-\d{5}/` to extract ticket from branch names
- Repo name: Underlined, links to GitHub with branch
- Branch display: Gray for master/main, clickable for feature branches
- Status badge: Hidden for `status === 'no-check'`
- Status colors: Green (healthy), Red (unhealthy), Yellow (error), Gray border (no-check)

**ActionButtons.jsx:**
- "Clear Redis Cache" button (orange, trash icon)
- "Rebuild Runtime-Core" button (purple, hammer icon)
- Shows success/error message for 3 seconds after Redis clear

**RebuildModal.jsx:**
- Streams progress from `/api/global/rebuild-runtime-core`
- Shows 4 steps with spinner/check icons
- Displays "Grab a coffee" message with coffee icon
- Parses newline-delimited JSON responses

**App.jsx:**
- React Query with 5-minute (300000ms) refetch interval
- Stats calculation excludes `status === 'no-check'` from error count

## Configuration Files

### services.json
- 15 services total
- First 2 have `"url": null, "type": "no-health-check"`
- Others have health check URLs and format types

### git-repos.json
- Maps all service IDs to `C:\MethodDev\{repo-name}` paths
- `"ms-apps-api": null` (no Git repo)
- `"ms-authentication-api-oauth2": "C:\\MethodDev\\oauth2"` (special mapping)

### troubleshooting.json
- Currently only contains RabbitMQ restart for specific services
- Redis and runtime-core actions are global (in UI, not per-service)

## Launcher Setup

**Why not IIS?** Dashboard controls IIS (stops/starts for runtime-core rebuild), so hosting on IIS would cause it to kill itself.

**Production Mode (Recommended):**
1. Double-click `start-dashboard.bat` - that's it!
2. Launcher auto-installs dependencies and auto-builds if needed
3. Opens http://localhost:3001 in browser
4. Node.js server runs in visible terminal window
5. To stop: Close terminal window

**Development Mode (For Active Development):**
1. Double-click `develop-dashboard.bat`
2. Opens TWO terminal windows:
   - Backend with auto-restart (Node.js `--watch` flag)
   - Frontend with hot reload (Vite dev server)
3. Changes appear instantly without manual rebuilds
4. Access at http://localhost:5173
5. To stop: Close both terminal windows

**Manual Build:**
- Run `build-dashboard.bat` to build frontend and check backend dependencies
- Useful after pulling code changes before running production mode

**Auto-start with Windows:**
- Create shortcut to `start-dashboard.bat`
- Press Win+R, type `shell:startup`, press Enter
- Place shortcut in startup folder

## Common Operations

### Adding a New Service
1. Add to `services.json` with id, name, url, type
2. Add to `git-repos.json` with path to repo (or null)
3. Frontend will automatically display new service

### Making Changes

**During Active Development:**
- Use `develop-dashboard.bat` for instant hot reload
- Frontend changes appear immediately (Vite HMR)
- Backend changes restart server automatically (Node.js --watch)

**After Changes in Production Mode:**
- Frontend: Run `build-dashboard.bat`, then close terminal and run `start-dashboard.bat`
- Backend: Just close terminal and run `start-dashboard.bat` (no rebuild needed)

## API Endpoints

- `GET /api/services` - All services with health + git info
- `GET /api/services/:serviceId` - Single service health
- `POST /api/global/clear-redis` - Clear cache
- `POST /api/global/rebuild-runtime-core` - Rebuild (streaming)
- `GET /api/health` - Dashboard health check
- `GET /*` - Serve frontend SPA (catch-all)

## Troubleshooting

### Dashboard won't start
**Check:** Port 3001 in use (`netstat -ano | findstr :3001`). Kill process or change port in server.js

### Cannot find module errors
**Solution:** Run `npm install` in backend folder, then restart

### Browser doesn't open
**Not a problem:** Server still running - manually go to http://localhost:3001

### Git branches not showing
**Check:** Paths in git-repos.json are correct and repos exist

## Design Patterns

### Status Handling
- `healthy` - All checks pass
- `unhealthy` - Some checks fail
- `error` - Cannot reach service
- `no-check` - Git-only, no health endpoint

### Branch Link Pattern
- Master/main: Display only (gray, no link)
- Feature branch: Extract PL-##### → Link to Jira ticket
- Repo name: Always links to GitHub with current branch

### Global vs Per-Service Actions
- **Global**: Redis cache, Runtime-core rebuild (in ActionButtons)
- **Per-Service**: RabbitMQ restart (in troubleshooting.json)

## UI Styling
- Tailwind CSS utility classes
- Dark theme: slate-900 background, slate-800 cards
- Icons: Lucide React
- Status colors: green-500 (healthy), red-500 (unhealthy), yellow-500 (error), slate-600 (no-check)
- Underline on repo names: `decoration-slate-600 hover:decoration-blue-400`

## Important Notes for Future Development
- Auto-refresh is 5 minutes (not 30 seconds) to reduce load
- Build/Release metadata removed from cards per user request
- Branch extraction handles patterns like `origin/PL-22414-v2`
- Runtime-core rebuild needs elevated permissions (handles via PowerShell)
- Frontend production build is served by backend (single server process)
- Batch launcher can auto-start with Windows via startup folder
- Dashboard runs independently of IIS (solves circular dependency for rebuilds)
