@echo off
echo 🚀 Chat2Chat Web - Production Deployment Setup
echo.

echo 📋 This script will help you prepare for cloud deployment
echo.

echo 📝 Step 1: Install required tools
choice /C YN /M "Install Vercel CLI globally"
if %ERRORLEVEL%==1 (
    echo Installing Vercel CLI...
    npm install -g vercel
)

choice /C YN /M "Install Railway CLI globally"
if %ERRORLEVEL%==1 (
    echo Installing Railway CLI...
    npm install -g @railway/cli
)

echo.
echo 🔧 Step 2: Build check
echo Testing if your project builds correctly...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed! Please fix errors before deploying.
    pause
    exit /b 1
)
echo ✅ Build successful!

echo.
echo 📚 Step 3: Deployment guides created
echo.
echo 📖 Please read: CLOUD_DEPLOYMENT_GUIDE.md
echo 🌐 Then follow these steps:
echo.
echo   1. Deploy signaling server to Railway
echo   2. Deploy frontend to Vercel  
echo   3. Configure environment variables
echo   4. Test your live app!
echo.

echo 🎯 Quick Commands:
echo   Railway deploy: railway login ^&^& railway up
echo   Vercel deploy:  vercel --prod
echo.

echo ✨ Your app will be live in ~10 minutes!
echo.
pause
