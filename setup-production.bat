@echo off
echo 🚀 Setting up Chat2Chat Web for stable production...

echo 📦 Installing PM2 globally...
npm install -g pm2

echo 🔧 Creating logs directory...
if not exist "logs" mkdir logs

echo 🛑 Stopping any existing processes...
pm2 stop all
pm2 delete all

echo 🚀 Starting Chat2Chat Web with PM2...
pm2 start ecosystem.config.json

echo 💾 Saving PM2 configuration...
pm2 save

echo 🔄 Setting up auto-startup...
pm2 startup

echo ✅ Setup complete!
echo.
echo 📊 View status: pm2 list
echo 📝 View logs: pm2 logs
echo 🔄 Restart: pm2 restart all
echo 🛑 Stop: pm2 stop all
echo.
echo 🌐 Your app will be available at:
echo   Frontend: http://localhost:8080
echo   Signaling: http://localhost:3001
echo.
pause
