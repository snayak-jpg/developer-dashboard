# IIS Deployment Guide for Method Health Check Dashboard

This guide will help you host the Method Health Check Dashboard on IIS so you don't need to run both projects manually.

## Prerequisites

1. **IIS** - Make sure IIS is installed and running on your Windows machine
2. **iisnode** - Download and install from https://github.com/tjanczuk/iisnode/releases
3. **URL Rewrite Module** - Download from https://www.iis.net/downloads/microsoft/url-rewrite
4. **Node.js** - Already installed on your system

## Setup Steps

### 1. Build the Frontend (Already Done)
The frontend has been built to `frontend/dist` folder.

### 2. Configure IIS

1. Open **IIS Manager** (search for "IIS" in Windows)

2. Create a new Application Pool:
   - Right-click "Application Pools" → "Add Application Pool"
   - Name: `MethodHealthCheckPool`
   - .NET CLR version: `No Managed Code`
   - Managed pipeline mode: `Integrated`
   - Click OK

3. Create a new Website:
   - Right-click "Sites" → "Add Website"
   - Site name: `MethodHealthCheck`
   - Application pool: `MethodHealthCheckPool`
   - Physical path: `C:\MethodServiceCheck\backend`
   - Binding:
     - Type: `http`
     - IP address: `All Unassigned`
     - Port: `8080` (or your preferred port)
     - Host name: (leave empty or use `healthcheck.local`)
   - Click OK

4. Configure Application Pool Identity:
   - Go to Application Pools
   - Right-click `MethodHealthCheckPool` → Advanced Settings
   - Under Process Model → Identity → Click the "..." button
   - Select "Custom account" → Set credentials
   - Click OK

### 3. Set Permissions

The application pool identity needs permissions to:
- Read/Write to `C:\MethodServiceCheck\backend` folder
- Execute Node.js
- Access git repositories in `C:\MethodDev`

Right-click the `C:\MethodServiceCheck\backend` folder:
1. Properties → Security → Edit
2. Add the IIS Application Pool identity: `IIS AppPool\MethodHealthCheckPool`
3. Grant "Read & Execute", "List folder contents", and "Read" permissions

### 4. Configure Node.js Path

If Node.js is not in the default location, edit `backend/web.config`:
```xml
<iisnode nodeProcessCommandLine="C:\Program Files\nodejs\node.exe" />
```

### 5. Access the Dashboard

Open your browser and navigate to:
- `http://localhost:8080` (or the port you configured)
- `http://healthcheck.local:8080` (if you set a host name)

## Configuration Files

### backend/web.config
This file tells IIS how to handle Node.js via iisnode. It's already configured to:
- Route all requests through server.js
- Watch for file changes to restart the server
- Serve static files from the frontend/dist folder

### backend/server.js
Updated to:
- Serve static files from `../frontend/dist`
- Handle all routes (API and SPA fallback)
- Use `process.env.PORT` for IIS compatibility

## Troubleshooting

### "HTTP Error 500.1003 - Internal Server Error"
- Make sure iisnode is installed
- Check that Node.js path in web.config is correct
- Verify Application Pool is set to "No Managed Code"

### "Cannot find module"
- Run `npm install` in the backend folder
- Check that node_modules folder exists

### Static files not loading
- Verify frontend was built: `cd frontend && npm run build`
- Check that `frontend/dist` folder exists with files

### Git commands failing
- Ensure Application Pool identity has access to git repos
- Verify git-repos.json paths are correct

## Updating the Application

When you make changes:

1. **Frontend changes:**
   ```bash
   cd frontend
   npm run build
   ```
   IIS will automatically pick up the new files.

2. **Backend changes:**
   - Just save your changes
   - IIS/iisnode will automatically restart the server (thanks to watchedFiles in web.config)

## Stopping/Starting the Site

- Open IIS Manager
- Right-click the site → Manage Website → Stop/Start

Or recycle the application pool:
- Right-click `MethodHealthCheckPool` → Recycle

## Logs

iisnode logs are located in:
`C:\MethodServiceCheck\backend\iisnode\`

Check these logs if you encounter issues.
