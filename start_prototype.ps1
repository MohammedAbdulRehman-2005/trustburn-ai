# TrustBurn AI — Rapid Local Startup Script (Windows PowerShell)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   TrustBurn AI — Component Burn-In Screening & Risk Intelligence" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Backend in separate process
Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000" -PassThru

Start-Sleep -Seconds 3

# 2. Start Frontend in separate process
Write-Host "[2/2] Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Green
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru

Write-Host "`nTrustBurn AI is now launching!" -ForegroundColor Cyan
Write-Host "  • Frontend UI: http://localhost:5173" -ForegroundColor White
Write-Host "  • Backend API: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  • API Docs:    http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
