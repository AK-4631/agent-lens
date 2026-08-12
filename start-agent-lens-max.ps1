$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Divya\Desktop\agent-lens"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       AGENT LENS MAX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Building..." -ForegroundColor Yellow

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD FAILED" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking port 4321..." -ForegroundColor Yellow

$port = Get-NetTCPConnection -LocalPort 4321 -State Listen -ErrorAction SilentlyContinue

if ($port) {

    Write-Host ""
    Write-Host "Agent Lens MAX is already running." -ForegroundColor Green
    Write-Host ""

    try {
        $health = Invoke-RestMethod `
            -Uri "http://127.0.0.1:4321/api/health" `
            -TimeoutSec 3

        Write-Host "HEALTH: OK" -ForegroundColor Green
        Write-Host ""
        $health | Format-List

    } catch {

        Write-Host "Port 4321 is occupied but health check failed." -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Dashboard: http://127.0.0.1:4321" -ForegroundColor Cyan
    exit 0
}

Write-Host ""
Write-Host "Starting Agent Lens MAX..." -ForegroundColor Green
Write-Host ""

npm start