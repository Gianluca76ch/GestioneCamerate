# ============================================
# SCRIPT DEPLOY - Gestione Camerate
# ============================================
# Uso: .\deploy.ps1 -Environment Production

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Development", "Production")]
    [string]$Environment,
    
    [string]$ServerName = "GE055GE052SRV01",
    [string]$ServerPath = "\\$ServerName\C$\inetpub\wwwroot\GestioneCamerate"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DEPLOY GESTIONE CAMERATE" -ForegroundColor Cyan
Write-Host "   Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# FRONTEND BUILD
Write-Host "`n📦 Building Frontend..." -ForegroundColor Yellow

Push-Location frontend

if (Test-Path "build") {
    Remove-Item "build" -Recurse -Force
    Write-Host "   ✓ Old build cleaned" -ForegroundColor Green
}

if ($Environment -eq "Production") {
    $env:NODE_ENV = "production"
    npm run build
} else {
    npm run build
}

Write-Host "   ✓ Frontend built successfully" -ForegroundColor Green
Pop-Location

# BACKEND - Verifica dipendenze
Write-Host "`n📦 Checking Backend dependencies..." -ForegroundColor Yellow

Push-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "   ✓ Backend ready" -ForegroundColor Green
Pop-Location

# DEPLOY TO SERVER (solo Production)
if ($Environment -eq "Production") {
    Write-Host "`n🚀 Deploying to server: $ServerName..." -ForegroundColor Yellow
    
    if (-not (Test-Path $ServerPath)) {
        Write-Host "   ❌ Cannot access server path: $ServerPath" -ForegroundColor Red
        Write-Host "   Make sure you have network access to the server" -ForegroundColor Red
        exit 1
    }
    
    $backupPath = "$ServerPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "   Creating backup: $backupPath" -ForegroundColor Gray
    Copy-Item $ServerPath $backupPath -Recurse -Force
    Write-Host "   ✓ Backup created" -ForegroundColor Green
    
    # Deploy Frontend
    Write-Host "`n   Deploying Frontend..." -ForegroundColor Yellow
    $frontendDest = "$ServerPath\frontend"
    
    $webConfigPath = "$frontendDest\web.config"
    $webConfigBackup = $null
    if (Test-Path $webConfigPath) {
        $webConfigBackup = Get-Content $webConfigPath -Raw
        Write-Host "   ✓ web.config saved" -ForegroundColor Green
    }
    
    robocopy "frontend\build" $frontendDest /MIR /XF web.config /NFL /NDL /NJH /NJS
    
    if ($webConfigBackup) {
        $webConfigBackup | Out-File $webConfigPath -Encoding UTF8 -NoNewline
        Write-Host "   ✓ web.config restored" -ForegroundColor Green
    }
    
    Write-Host "   ✓ Frontend deployed" -ForegroundColor Green
    
    # Deploy Backend
    Write-Host "`n   Deploying Backend..." -ForegroundColor Yellow
    $backendDest = "$ServerPath\backend"
    
    $envPath = "$backendDest\.env"
    $envBackup = $null
    if (Test-Path $envPath) {
        $envBackup = Get-Content $envPath -Raw
        Write-Host "   ✓ .env saved" -ForegroundColor Green
    }
    
    robocopy "backend" $backendDest /MIR /XD node_modules /XF .env web.config /NFL /NDL /NJH /NJS
    
    if ($envBackup) {
        $envBackup | Out-File $envPath -Encoding UTF8 -NoNewline
        Write-Host "   ✓ .env restored" -ForegroundColor Green
    }
    
    Write-Host "`n   Installing backend dependencies on server..." -ForegroundColor Yellow
    Invoke-Command -ComputerName $ServerName -ScriptBlock {
        param($path)
        Set-Location $path
        npm install --production
    } -ArgumentList "C:\inetpub\wwwroot\GestioneCamerate\backend"
    
    Write-Host "   ✓ Backend deployed" -ForegroundColor Green
    
    # Riavvia servizi
    Write-Host "`n🔄 Restarting services..." -ForegroundColor Yellow
    
    Invoke-Command -ComputerName $ServerName -ScriptBlock {
        Restart-Service -Name "GestioneCamerateBackend" -ErrorAction SilentlyContinue
        Import-Module WebAdministration
        Restart-WebAppPool -Name "GestioneCameratePool"
        Restart-Website -Name "GestioneCamerate"
    }
    
    Write-Host "   ✓ Services restarted" -ForegroundColor Green
    
    Write-Host "`n✅ DEPLOY COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "   Application URL: http://$ServerName:85" -ForegroundColor Cyan
    Write-Host "   Backup location: $backupPath" -ForegroundColor Gray
    
} else {
    Write-Host "`n✅ BUILD COMPLETED!" -ForegroundColor Green
    Write-Host "   Frontend: frontend\build\" -ForegroundColor Cyan
    Write-Host "   Backend: backend\" -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   DEPLOY FINISHED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
