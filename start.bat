@echo off
echo Starting SYNAPSE-1 Digital Twin...
echo.

echo [1/2] Starting backend (port 8000)...
start "SYNAPSE-1 Backend" /D "%~dp0backend" cmd /c "py -3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting frontend (port 3000)...
start "SYNAPSE-1 Frontend" /D "%~dp0frontend" cmd /c "npm run dev"

echo.
echo Waiting for services to start...
timeout /t 8 /nobreak > nul

echo.
echo SYNAPSE-1 Digital Twin is running:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo Login: ground/ground  or  crew01-12/crew
echo.
start http://localhost:3000
