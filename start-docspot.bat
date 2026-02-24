@echo off
echo Starting DocSpot Appointment System...
echo.

echo Step 1: Checking MongoDB...
sc query MongoDB | find "RUNNING" > nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running
) else (
    echo ⚠ Starting MongoDB...
    net start MongoDB
)

echo.
echo Step 2: Starting Backend Server...
start cmd /k "cd backend && npm start"

timeout /t 5

echo.
echo Step 3: Starting Frontend...
start cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo DocSpot is starting up!
echo ========================================
echo.
echo Backend URL: http://localhost:5000
echo Frontend URL: http://localhost:3000
echo.
echo Default Admin Login:
echo Email: admin@docspot.com
echo Password: admin123
echo.
echo Press any key to open the application...
pause > nul
start http://localhost:3000