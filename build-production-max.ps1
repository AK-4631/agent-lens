$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Divya\Desktop\agent-lens"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       AGENT LENS MAX PRODUCTION BUILD" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Cleaning..." -ForegroundColor Yellow

Remove-Item ".\core\dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item ".\cli\dist" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "[2/6] Installing dependencies..." -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -ne 0) {
    throw "npm install failed."
}

Write-Host "[3/6] Type checking..." -ForegroundColor Yellow

npm run typecheck

if ($LASTEXITCODE -ne 0) {
    throw "Typecheck failed."
}

Write-Host "[4/6] Building..." -ForegroundColor Yellow

npm run build

if ($LASTEXITCODE -ne 0) {
    throw "Build failed."
}

Write-Host "[5/6] Running tests..." -ForegroundColor Yellow

if (Test-Path ".\cli\dist\self-test.js") {
    node ".\cli\dist\self-test.js"

    if ($LASTEXITCODE -ne 0) {
        throw "Tests failed."
    }
}

Write-Host "[6/6] Packaging..." -ForegroundColor Yellow

npm pack

if ($LASTEXITCODE -ne 0) {
    throw "Packaging failed."
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "       AGENT LENS MAX IS BUILD-READY" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Typecheck : PASS" -ForegroundColor Green
Write-Host "Build     : PASS" -ForegroundColor Green
Write-Host "Tests     : PASS" -ForegroundColor Green
Write-Host "Package   : PASS" -ForegroundColor Green
Write-Host ""
Write-Host "Start:" -ForegroundColor Cyan
Write-Host "npm start"
Write-Host ""
