# Step-by-Step IIS Setup Guide

Follow these exact steps to set up the Method Health Check Dashboard on IIS.

## Prerequisites Check

Before starting, verify you have:
- [ ] IIS installed (Windows Feature)
- [ ] Node.js installed (you already have this)
- [ ] iisnode installed (download from https://github.com/tjanczuk/iisnode/releases - get the latest .msi file)
- [ ] URL Rewrite Module (download from https://www.iis.net/downloads/microsoft/url-rewrite)

**How to check if IIS is installed:**
1. Press Windows key + R
2. Type `inetmgr` and press Enter
3. If IIS Manager opens, you have IIS installed ✓
4. If not, you need to enable it in Windows Features

---

## Step 1: Open IIS Manager

1. Press **Windows key**
2. Type **IIS Manager** or **inetmgr**
3. Click **Internet Information Services (IIS) Manager**
4. The IIS Manager window will open

---

## Step 2: Create Application Pool

**Why?** An Application Pool is an isolated environment for your Node.js app to run in.

1. In IIS Manager, look at the left panel (Connections)
2. Click on your computer name to expand it (e.g., "WIN-COMPUTER")
3. You'll see **Application Pools** - click on it
4. On the right side, click **Add Application Pool...**

**In the popup window, enter:**
- **Name:** `MethodHealthCheckPool`
- **.NET CLR version:** Select **No Managed Code** (IMPORTANT!)
- **Managed pipeline mode:** `Integrated`
- **Start application pool immediately:** ✓ (checked)

5. Click **OK**

**Result:** You should now see "MethodHealthCheckPool" in the list of application pools.

---

## Step 3: Configure Application Pool Identity

**Why?** This sets what user account the app runs under.

1. Still in the **Application Pools** view
2. Find **MethodHealthCheckPool** in the list
3. **Right-click** on it → Select **Advanced Settings...**

4. In the Advanced Settings window:
   - Scroll down to find **Process Model** section
   - Click on **Identity**
   - Click the **...** button on the right

5. In the "Application Pool Identity" dialog:
   - Select **Built-in account**
   - In the dropdown, select **LocalSystem**
   - Click **OK**

**Why LocalSystem?** It needs permissions to:
- Read your C:\MethodServiceCheck files
- Execute Node.js
- Access git repos in C:\MethodDev
- Run commands like iisreset, redis-cli

6. Click **OK** to close Advanced Settings

---

## Step 4: Create the Website

**Why?** This tells IIS where your app files are and what port to use.

1. In the left panel (Connections), click on **Sites**
2. On the right side, click **Add Website...**

**In the "Add Website" window, fill in:**

- **Site name:** `MethodHealthCheck`

- **Application pool:** Click **Select...** button
  - Choose **MethodHealthCheckPool** from the dropdown
  - Click **OK**

- **Physical path:** Click the **...** button
  - Navigate to `C:\MethodServiceCheck\backend`
  - Click **OK**

- **Binding section:**
  - Type: `http`
  - IP address: `All Unassigned`
  - Port: `8080` (you can change this if 8080 is already used)
  - Host name: (leave empty)

3. Click **OK**

**Result:**
- You should see "MethodHealthCheck" in the Sites list
- It should show "Started" in the State column
- If it says "Stopped", right-click → Manage Website → Start

---

## Step 5: Test the Website

1. Open your web browser
2. Go to: **http://localhost:8080**
3. You should see the Method Health Check Dashboard!

**If you see an error, proceed to Step 6 for troubleshooting.**

---

## Step 6: Troubleshooting Common Issues

### Error: "HTTP Error 500.0 - Internal Server Error"

**Cause:** iisnode might not be installed correctly.

**Fix:**
1. Download iisnode from https://github.com/tjanczuk/iisnode/releases
2. Get the file: `iisnode-full-v0.2.21-x64.msi` (or latest version)
3. Run the installer
4. Restart IIS:
   - In IIS Manager, click on your server name (top level)
   - On the right side, click **Restart**

---

### Error: "HTTP Error 404.0 - Not Found"

**Cause:** URL Rewrite module not installed.

**Fix:**
1. Download from https://www.iis.net/downloads/microsoft/url-rewrite
2. Install the module
3. Restart IIS

---

### Error: "HTTP Error 500.1003 - Internal Server Error"

**Cause:** Application pool is set to wrong .NET version.

**Fix:**
1. Go to **Application Pools**
2. Right-click **MethodHealthCheckPool** → **Basic Settings**
3. Change **.NET CLR version** to **No Managed Code**
4. Click **OK**
5. Right-click the pool → **Recycle**

---

### Error: Page loads but API calls fail

**Cause:** CORS or permissions issue.

**Fix:**
1. Go to **Application Pools**
2. Right-click **MethodHealthCheckPool** → **Advanced Settings**
3. Change **Identity** to **LocalSystem** (see Step 3)
4. Restart the site

---

### Error: "Cannot find module 'express'"

**Cause:** node_modules not installed.

**Fix:**
1. Open Command Prompt as Administrator
2. Run:
   ```bash
   cd C:\MethodServiceCheck\backend
   npm install
   ```
3. After installation completes, restart the site in IIS

---

## Step 7: Verify Everything Works

Test these features to make sure everything is working:

1. ✓ Dashboard loads at http://localhost:8080
2. ✓ Service cards appear with status
3. ✓ Git branch names show correctly
4. ✓ Clicking repo names opens GitHub
5. ✓ Clicking branch names opens Jira tickets
6. ✓ "Refresh" button works
7. ✓ "Clear Redis Cache" button works
8. ✓ "Rebuild Runtime-Core" button works

---

## Step 8: Auto-Start with Windows

Good news! IIS sites start automatically when Windows starts, so your dashboard will always be available.

**To verify auto-start is enabled:**
1. In IIS Manager → Sites
2. Click on **MethodHealthCheck**
3. On the right side, under **Manage Website**, you'll see options
4. The site should be **Started** (not stopped)

---

## Viewing Logs

If you encounter issues, check the logs:

**IIS Logs:**
`C:\inetpub\logs\LogFiles\W3SVC[number]\`

**iisnode Logs:**
`C:\MethodServiceCheck\backend\iisnode\`

Look for the most recent log file and check for error messages.

---

## Making Updates

### When you change frontend code:
```bash
cd C:\MethodServiceCheck\frontend
npm run build
```
The site will automatically pick up the new files within a few seconds.

### When you change backend code:
Just save your changes! The web.config is configured to watch for file changes and automatically restart the Node.js process.

**Or manually restart:**
1. IIS Manager → Application Pools
2. Right-click **MethodHealthCheckPool** → **Recycle**

---

## Changing the Port

If you need to use a different port (e.g., 3000 instead of 8080):

1. IIS Manager → Sites
2. Right-click **MethodHealthCheck** → **Edit Bindings...**
3. Click on the http binding → **Edit...**
4. Change **Port** to your desired port
5. Click **OK** → **Close**
6. Access the site at the new port: http://localhost:[new-port]

---

## Stopping the Site

If you need to stop the site temporarily:

1. IIS Manager → Sites
2. Right-click **MethodHealthCheck**
3. Select **Manage Website** → **Stop**

To start it again:
- **Manage Website** → **Start**

---

## Need Help?

If you encounter an error not covered here:

1. Check the iisnode logs: `C:\MethodServiceCheck\backend\iisnode\`
2. Check IIS logs: `C:\inetpub\logs\LogFiles\`
3. Make sure all prerequisites are installed
4. Try restarting IIS completely (right-click server name → Restart)

---

**You're all set! 🎉**

Once completed, you can access your dashboard anytime at:
**http://localhost:8080**

No need to run `npm start` manually anymore!
