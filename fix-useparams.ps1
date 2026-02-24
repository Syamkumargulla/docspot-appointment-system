# fix-useparams.ps1
$appJsPath = "C:\Users\syamk\Downloads\docspot-appointment-system\frontend\src\App.js"

Write-Host "Fixing useParams error..." -ForegroundColor Yellow

if (Test-Path $appJsPath) {
    $content = Get-Content $appJsPath -Raw
    
    # Check if useParams is already in the import
    if ($content -match "useParams") {
        Write-Host "✅ useParams already in imports" -ForegroundColor Green
    } else {
        # Add useParams to the react-router-dom import
        $fixed = $content -replace "import \{ (.*?) \} from 'react-router-dom'", "import { `$1, useParams } from 'react-router-dom'"
        $fixed | Set-Content $appJsPath
        Write-Host "✅ Added useParams to imports" -ForegroundColor Green
    }
    
    Write-Host "`n🔄 Restarting frontend..." -ForegroundColor Yellow
    
    # Kill any running node processes for frontend
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*react-scripts*" } | Stop-Process -Force
    
    Write-Host "`n✅ Fix applied! Start frontend with:" -ForegroundColor Green
    Write-Host "cd frontend && npm start" -ForegroundColor Cyan
} else {
    Write-Host "❌ App.js not found!" -ForegroundColor Red
}