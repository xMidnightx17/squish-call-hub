# 🛡️ Chat2Chat Web - Production Deployment Guide

## 🎯 **Stable Server Deployment Options**

### **Option 1: Cloud Deployment (Recommended for Production)**

#### **🌐 Frontend Deployment**
```bash
# Deploy to Vercel (Free tier available)
npm install -g vercel
vercel

# Or deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod
```

#### **🔗 Signaling Server Deployment**

**Railway (Easiest - Free tier):**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy signaling server
cd signaling-server
railway login
railway init
railway up
```

**Heroku (Popular choice):**
```bash
# Install Heroku CLI and deploy
cd signaling-server
heroku create your-app-name-signaling
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

**DigitalOcean App Platform:**
- Upload to GitHub
- Connect DigitalOcean to your repo
- Auto-deploy on commits

### **Option 2: Local Production Setup (For development/testing)**

#### **🔧 Process Managers (Keep servers running)**

**PM2 (Recommended):**
```bash
# Install PM2 globally
npm install -g pm2

# Start signaling server with PM2
cd signaling-server
pm2 start server.js --name "chat2chat-signaling"

# Start frontend with PM2
cd ..
pm2 start "npm run dev" --name "chat2chat-frontend"

# Save PM2 configuration
pm2 save
pm2 startup

# View running processes
pm2 list
pm2 logs
```

**Forever (Alternative):**
```bash
# Install Forever
npm install -g forever

# Start servers
cd signaling-server
forever start server.js

cd ..
forever start -c "npm run dev" .
```

#### **🚀 Docker Setup (Advanced)**
```dockerfile
# Dockerfile for signaling server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  signaling-server:
    build: ./signaling-server
    ports:
      - "3001:3001"
    restart: unless-stopped
  
  frontend:
    build: .
    ports:
      - "8080:8080"
    restart: unless-stopped
    depends_on:
      - signaling-server
```

### **Option 3: Windows Service (For Windows servers)**

**Create Windows Service:**
```bash
# Install node-windows
npm install -g node-windows

# Create service script (create-service.js)
var Service = require('node-windows').Service;

var svc = new Service({
  name: 'Chat2Chat Signaling',
  description: 'WebRTC signaling server for Chat2Chat Web',
  script: 'C:\\path\\to\\signaling-server\\server.js'
});

svc.on('install', function(){
  svc.start();
});

svc.install();
```

## 🔧 **Stability & Monitoring**

### **Health Checks & Auto-restart:**

**Add to signaling server (server.js):**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
```

**Monitoring Script (monitor.js):**
```javascript
const http = require('http');
const { spawn } = require('child_process');

function checkServer() {
  const req = http.request('http://localhost:3001/health', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Server healthy');
    } else {
      console.log('❌ Server unhealthy, restarting...');
      restartServer();
    }
  });

  req.on('error', () => {
    console.log('❌ Server down, restarting...');
    restartServer();
  });

  req.end();
}

function restartServer() {
  spawn('pm2', ['restart', 'chat2chat-signaling']);
}

// Check every 30 seconds
setInterval(checkServer, 30000);
```

### **Log Management:**
```bash
# PM2 log rotation
pm2 install pm2-logrotate

# View logs
pm2 logs chat2chat-signaling --lines 100
pm2 flush  # Clear logs
```

## 📊 **Recommended Production Setup**

### **🥇 Best Choice: Cloud Deployment**

1. **Frontend**: Vercel/Netlify (Free, auto-scaling, CDN)
2. **Signaling Server**: Railway/Heroku (Easy, managed, auto-restart)
3. **Database**: Supabase (Already set up)

### **🥈 Local Development: PM2**

1. **Install PM2**: `npm install -g pm2`
2. **Start servers**: 
   ```bash
   pm2 start signaling-server/server.js --name signaling
   pm2 start "npm run dev" --name frontend
   pm2 save && pm2 startup
   ```

### **🏆 Enterprise: Docker + Kubernetes**

For large-scale deployment with load balancing and high availability.

## 🎯 **Quick Start (PM2 Setup)**

Let me create the PM2 configuration for you:

```json
{
  "apps": [
    {
      "name": "chat2chat-signaling",
      "script": "signaling-server/server.js",
      "watch": false,
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3001
      },
      "error_file": "./logs/signaling-error.log",
      "out_file": "./logs/signaling-out.log",
      "log_file": "./logs/signaling.log",
      "time": true
    },
    {
      "name": "chat2chat-frontend",
      "script": "npm",
      "args": "run dev",
      "watch": false,
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "development"
      },
      "error_file": "./logs/frontend-error.log",
      "out_file": "./logs/frontend-out.log",
      "log_file": "./logs/frontend.log",
      "time": true
    }
  ]
}
```

## 🛡️ **Benefits of Each Approach:**

| Solution | Stability | Cost | Ease | Scale |
|----------|-----------|------|------|-------|
| Cloud (Railway/Vercel) | ⭐⭐⭐⭐⭐ | Free/Low | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| PM2 Local | ⭐⭐⭐⭐ | Free | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Docker | ⭐⭐⭐⭐⭐ | Low | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Windows Service | ⭐⭐⭐ | Free | ⭐⭐ | ⭐⭐ |

**Recommendation**: Start with **Railway + Vercel** for instant production deployment, or **PM2** for local development stability!
