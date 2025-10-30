import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the frontend dist folder
app.use(express.static(join(__dirname, '../frontend/dist')));

// Load configurations
let services = [];
let troubleshootingConfig = {};
let gitRepos = {};

async function loadConfigs() {
  try {
    const servicesData = await readFile(join(__dirname, 'services.json'), 'utf-8');
    services = JSON.parse(servicesData);

    const troubleshootingData = await readFile(join(__dirname, 'troubleshooting.json'), 'utf-8');
    troubleshootingConfig = JSON.parse(troubleshootingData);

    const gitReposData = await readFile(join(__dirname, 'git-repos.json'), 'utf-8');
    gitRepos = JSON.parse(gitReposData);

    console.log(`Loaded ${services.length} services`);
  } catch (error) {
    console.error('Error loading configurations:', error);
  }
}

// Get current Git branch for a repository
async function getGitBranch(repoPath) {
  if (!repoPath) return null;

  return new Promise((resolve) => {
    const proc = spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repoPath
    });

    let stdout = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        resolve(null);
      }
    });
    proc.on('error', () => resolve(null));
  });
}

// Parse health check response based on format type
function parseHealthResponse(data, type) {
  const result = {
    overall: 'unknown',
    dependencies: [],
    metadata: {}
  };

  try {
    if (type === 'status-results') {
      // Format: { status: "Healthy", results: {...} }
      result.overall = data.status?.toLowerCase() === 'healthy' ? 'healthy' : 'unhealthy';

      if (data.results) {
        result.dependencies = Object.entries(data.results).map(([name, info]) => ({
          name,
          status: info.status?.toLowerCase() === 'healthy' ? 'healthy' : 'unhealthy',
          description: info.description || null
        }));
      }
    } else if (type === 'dependencies' || type === 'buildnumber-dependencies') {
      // Format: { Dependencies: [...], Build: "...", Release: "..." }
      result.metadata.build = data.Build || data.BuildNumber || null;
      result.metadata.release = data.Release || data.BuildRelease || null;

      if (data.Dependencies && Array.isArray(data.Dependencies)) {
        result.dependencies = data.Dependencies.map(dep => ({
          name: dep.DependencyName,
          status: dep.DependencyStatus?.toLowerCase() === 'success' ? 'healthy' : 'unhealthy',
          type: dep.DependencyType,
          timeMs: dep.DependencyTimeInMilliseconds
        }));

        // Overall status is healthy only if ALL dependencies are successful
        const allHealthy = result.dependencies.every(d => d.status === 'healthy');
        result.overall = allHealthy ? 'healthy' : 'unhealthy';
      }
    }
  } catch (error) {
    console.error('Error parsing health response:', error);
    result.overall = 'error';
  }

  return result;
}

// Check health for a single service
async function checkServiceHealth(service) {
  // Skip health check for services without URLs
  if (!service.url || service.type === 'no-health-check') {
    return {
      ...service,
      status: 'no-check',
      lastChecked: new Date().toISOString()
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(service.url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        ...service,
        status: 'error',
        error: `HTTP ${response.status}`,
        lastChecked: new Date().toISOString()
      };
    }

    const data = await response.json();
    const parsed = parseHealthResponse(data, service.type);

    return {
      ...service,
      status: parsed.overall,
      dependencies: parsed.dependencies,
      metadata: parsed.metadata,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      ...service,
      status: 'error',
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

// API Routes

// Get all services with health status
app.get('/api/services', async (req, res) => {
  try {
    const healthChecks = await Promise.all(
      services.map(async (service) => {
        const health = await checkServiceHealth(service);
        const repoPath = gitRepos[service.id];
        const gitBranch = await getGitBranch(repoPath);

        // Extract actual repo name from path for GitHub links
        let repoName = service.id;
        if (repoPath) {
          const pathParts = repoPath.split('\\');
          repoName = pathParts[pathParts.length - 1];
        }

        return {
          ...health,
          gitBranch,
          hasGitRepo: !!repoPath,
          repoName
        };
      })
    );

    res.json(healthChecks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single service health
app.get('/api/services/:serviceId', async (req, res) => {
  try {
    const service = services.find(s => s.id === req.params.serviceId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const health = await checkServiceHealth(service);
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get troubleshooting actions for a service
app.get('/api/troubleshooting/:serviceId', (req, res) => {
  const actions = troubleshootingConfig[req.params.serviceId] || [];
  res.json(actions);
});

// Execute troubleshooting action
app.post('/api/troubleshoot/:serviceId/:actionId', (req, res) => {
  const { serviceId, actionId } = req.params;
  const actions = troubleshootingConfig[serviceId] || [];
  const action = actions.find(a => a.id === actionId);

  if (!action) {
    return res.status(404).json({ error: 'Action not found' });
  }

  // Execute command
  const options = action.shell ? { shell: true } : {};
  const process = spawn(action.command, action.args || [], options);

  let stdout = '';
  let stderr = '';
  let responded = false;

  process.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  process.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  process.on('close', (code) => {
    if (!responded) {
      responded = true;
      res.json({
        success: code === 0,
        code,
        stdout,
        stderr,
        message: code === 0 ? 'Command executed successfully' : 'Command failed'
      });
    }
  });

  process.on('error', (error) => {
    if (!responded) {
      responded = true;
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to execute command'
      });
    }
  });
});

// Custom troubleshooting command
app.post('/api/troubleshoot/custom', (req, res) => {
  const { command, args, serviceId } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  const process = spawn(command, args || [], { shell: true });

  let stdout = '';
  let stderr = '';
  let responded = false;

  process.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  process.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  process.on('close', (code) => {
    if (!responded) {
      responded = true;
      res.json({
        success: code === 0,
        code,
        stdout,
        stderr,
        message: code === 0 ? 'Command executed successfully' : 'Command failed'
      });
    }
  });

  process.on('error', (error) => {
    if (!responded) {
      responded = true;
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to execute command'
      });
    }
  });
});

// Rebuild runtime-core (multi-step process)
app.post('/api/global/rebuild-runtime-core', async (req, res) => {
  const solutionPath = 'C:\\MethodDev\\runtime-core\\runtime-stack.sln';

  // Set headers for streaming response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');

  const sendProgress = (step, status, message, output = '') => {
    res.write(JSON.stringify({ step, status, message, output }) + '\n');
  };

  try {
    // Step 1: Stop IIS
    sendProgress(1, 'running', 'Stopping IIS...');
    const stopResult = await new Promise((resolve) => {
      // Use PowerShell with -Verb RunAs to request elevation
      const proc = spawn('powershell', ['-Command', 'Start-Process', 'iisreset', '-ArgumentList', '/stop', '-Verb', 'RunAs', '-Wait', '-WindowStyle', 'Hidden']);
      let stdout = '', stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => resolve({ code, stdout, stderr: stderr || 'IIS stopped (elevated)' }));
      proc.on('error', (error) => resolve({ code: -1, error: error.message }));
    });

    if (stopResult.code !== 0) {
      sendProgress(1, 'error', 'Failed to stop IIS', stopResult.stderr || stopResult.error);
      res.end();
      return;
    }
    sendProgress(1, 'success', 'IIS stopped successfully', stopResult.stdout);

    // Step 2: Clean solution
    sendProgress(2, 'running', 'Cleaning solution...');
    const cleanResult = await new Promise((resolve) => {
      const proc = spawn('dotnet', ['clean', solutionPath]);
      let stdout = '', stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => resolve({ code, stdout, stderr }));
      proc.on('error', (error) => resolve({ code: -1, error: error.message }));
    });

    if (cleanResult.code !== 0) {
      sendProgress(2, 'error', 'Failed to clean solution', cleanResult.stderr || cleanResult.error);
      res.end();
      return;
    }
    sendProgress(2, 'success', 'Solution cleaned successfully', cleanResult.stdout);

    // Step 3: Build solution
    sendProgress(3, 'running', 'Building solution... (this may take a while)');
    const buildResult = await new Promise((resolve) => {
      const proc = spawn('dotnet', ['build', solutionPath]);
      let stdout = '', stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => resolve({ code, stdout, stderr }));
      proc.on('error', (error) => resolve({ code: -1, error: error.message }));
    });

    if (buildResult.code !== 0) {
      const isLocked = buildResult.stderr?.includes('being used by another process') ||
                       buildResult.stderr?.includes('locked');
      const errorMsg = isLocked
        ? 'Build failed - files are locked. Please close AppUpdateAgent, MethodHealthChecks, or any other process using the bin folder.'
        : 'Failed to build solution';
      sendProgress(3, 'error', errorMsg, buildResult.stderr || buildResult.error);
      res.end();
      return;
    }
    sendProgress(3, 'success', 'Solution built successfully', buildResult.stdout);

    // Step 4: Restart IIS
    sendProgress(4, 'running', 'Restarting IIS...');
    const startResult = await new Promise((resolve) => {
      // Use PowerShell with -Verb RunAs to request elevation
      const proc = spawn('powershell', ['-Command', 'Start-Process', 'iisreset', '-ArgumentList', '/start', '-Verb', 'RunAs', '-Wait', '-WindowStyle', 'Hidden']);
      let stdout = '', stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });
      proc.on('close', (code) => resolve({ code, stdout, stderr: stderr || 'IIS started (elevated)' }));
      proc.on('error', (error) => resolve({ code: -1, error: error.message }));
    });

    if (startResult.code !== 0) {
      sendProgress(4, 'error', 'Failed to restart IIS', startResult.stderr || startResult.error);
      res.end();
      return;
    }
    sendProgress(4, 'success', 'IIS restarted successfully', startResult.stdout);

    // All done!
    sendProgress(5, 'complete', 'Runtime-core rebuilt successfully!');
    res.end();

  } catch (error) {
    sendProgress(0, 'error', 'Unexpected error', error.message);
    res.end();
  }
});

// Clear Redis cache (dashboard-level action)
app.post('/api/global/clear-redis', (req, res) => {
  // Use full path since environment variables updated after this session started
  const redisCliPath = 'C:\\Program Files\\Redis\\redis-cli.exe';
  const process = spawn(redisCliPath, ['-h', 'localhost', '-p', '6379', '-c', 'flushall']);

  let stdout = '';
  let stderr = '';
  let responded = false;

  process.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  process.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  process.on('close', (code) => {
    if (!responded) {
      responded = true;
      res.json({
        success: code === 0,
        code,
        stdout,
        stderr,
        message: code === 0 ? 'Cache cleared successfully' : 'Failed to clear cache'
      });
    }
  });

  process.on('error', (error) => {
    if (!responded) {
      responded = true;
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to execute redis-cli command'
      });
    }
  });
});

// Health check for the dashboard itself
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    servicesCount: services.length
  });
});

// Serve the frontend for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/dist/index.html'));
});

// Initialize and start server
async function start() {
  await loadConfigs();

  app.listen(PORT, () => {
    console.log(`Method Health Check Dashboard running on http://localhost:${PORT}`);
    console.log(`Monitoring ${services.length} microservices`);
  });
}

start();
