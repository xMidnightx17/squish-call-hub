const http = require('http');
const { exec } = require('child_process');

console.log('🔍 Starting Chat2Chat Web monitoring service...');

let consecutiveFailures = 0;
const MAX_FAILURES = 3;
const CHECK_INTERVAL = 30000; // 30 seconds

function checkSignalingServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log(`✅ Signaling server healthy - Uptime: ${Math.floor(health.uptime)}s, Users: ${health.activeUsers}, Rooms: ${health.activeRooms}`);
          consecutiveFailures = 0;
          resolve(true);
        } catch (e) {
          console.log('❌ Invalid health response');
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Signaling server health check failed: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Signaling server health check timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

function checkFrontend() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/',
      timeout: 5000
    }, (res) => {
      console.log(`✅ Frontend server healthy - Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ Frontend server check failed: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Frontend server check timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

function restartServices() {
  console.log('🔄 Attempting to restart services...');
  
  exec('pm2 restart all', (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ Restart failed: ${error.message}`);
      return;
    }
    console.log('✅ Services restarted successfully');
    console.log(stdout);
  });
}

async function performHealthChecks() {
  console.log(`\n🔍 Performing health checks... [${new Date().toLocaleString()}]`);
  
  const [signalingHealthy, frontendHealthy] = await Promise.all([
    checkSignalingServer(),
    checkFrontend()
  ]);

  if (!signalingHealthy || !frontendHealthy) {
    consecutiveFailures++;
    console.log(`⚠️  Health check failed (${consecutiveFailures}/${MAX_FAILURES})`);
    
    if (consecutiveFailures >= MAX_FAILURES) {
      console.log('🚨 Maximum failures reached, restarting services...');
      restartServices();
      consecutiveFailures = 0;
    }
  }
}

// Initial check
performHealthChecks();

// Schedule regular checks
setInterval(performHealthChecks, CHECK_INTERVAL);

console.log(`🛡️  Monitoring started - checking every ${CHECK_INTERVAL/1000} seconds`);
console.log('📊 Press Ctrl+C to stop monitoring\n');
