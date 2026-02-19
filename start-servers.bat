@echo off
echo Starting UNO Game Servers...
echo.
echo Starting Backend Server on port 3001...
start cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend React App on port 3000...
start cmd /k "npm start"
echo.
echo Both servers are starting!
echo - Backend: http://localhost:3001
echo - Frontend: http://localhost:3000
echo.
pause
