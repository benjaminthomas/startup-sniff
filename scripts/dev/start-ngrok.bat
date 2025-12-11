@echo off
REM Start ngrok tunnel for local webhook testing
REM Usage: scripts\start-ngrok.bat

echo.
echo 🚀 Starting ngrok tunnel for webhook testing...
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ngrok is not installed
    echo.
    echo Install ngrok:
    echo   npm install -g ngrok
    echo.
    echo Or download from: https://ngrok.com/download
    exit /b 1
)

echo ✅ ngrok is installed
echo 🔗 Starting tunnel on port 3000...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ⚠️  IMPORTANT: Keep this terminal window open!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📝 After ngrok starts:
echo.
echo 1. Copy the HTTPS forwarding URL (e.g., https://abc123.ngrok-free.app)
echo 2. Go to: https://dashboard.razorpay.com/app/webhooks
echo 3. Create webhook with URL: https://YOUR-URL.ngrok-free.app/api/webhooks/razorpay
echo 4. Use secret from .env.local: RAZORPAY_WEBHOOK_SECRET
echo.
echo 🔍 View requests: http://127.0.0.1:4040
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Start ngrok on port 3000
ngrok http 3000
