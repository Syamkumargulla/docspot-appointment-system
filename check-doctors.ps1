# check-doctors.ps1
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "DocSpot Doctor Check Utility" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if backend is running
Write-Host "`nStep 1: Checking Backend Connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -Method Head -ErrorAction Stop
    Write-Host "✅ Backend is running on port 5000" -ForegroundColor Green
    $backendRunning = $true
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Start backend with: cd backend && npm start" -ForegroundColor White
    $backendRunning = $false
}

# Check approved doctors if backend is running
if ($backendRunning) {
    Write-Host "`nStep 2: Fetching Approved Doctors..." -ForegroundColor Yellow
    try {
        $doctors = Invoke-RestMethod -Uri "http://localhost:5000/api/doctors/approved" -Method Get
        
        if ($doctors.Count -eq 0) {
            Write-Host "❌ No approved doctors found!" -ForegroundColor Red
            Write-Host "`nYou need to:" -ForegroundColor Yellow
            Write-Host "1. Register doctor accounts" -ForegroundColor White
            Write-Host "2. Login as admin (admin@docspot.com / admin123)" -ForegroundColor White
            Write-Host "3. Approve doctors in Admin Panel" -ForegroundColor White
        } else {
            Write-Host "✅ Found $($doctors.Count) approved doctor(s):" -ForegroundColor Green
            Write-Host "-----------------------------------" -ForegroundColor Cyan
            $doctors | ForEach-Object {
                Write-Host "👨‍⚕️ Dr. $($_.userId.name)" -ForegroundColor Green
                Write-Host "   Specialization: $($_.specialization)" -ForegroundColor White
                Write-Host "   Qualification: $($_.qualification)" -ForegroundColor White
                Write-Host "   Experience: $($_.experience) years" -ForegroundColor White
                Write-Host "   Fee: ₹$($_.consultationFee)" -ForegroundColor White
                Write-Host "   Hospital: $($_.hospitalName)" -ForegroundColor White
                Write-Host "-----------------------------------" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "❌ Error fetching doctors: $_" -ForegroundColor Red
    }
}

# Check all doctors in database (including unapproved)
Write-Host "`nStep 3: Checking Database (if MongoDB is running)..." -ForegroundColor Yellow

# Try using mongosh if available
$mongoshCheck = Get-Command mongosh -ErrorAction SilentlyContinue
if ($mongoshCheck) {
    try {
        $totalDoctors = & mongosh --quiet --eval "db.getSiblingDB('docspot').users.find({role:'doctor'}).count()"
        $approvedDoctors = & mongosh --quiet --eval "db.getSiblingDB('docspot').doctors.find({isApproved:true}).count()"
        $pendingDoctors = & mongosh --quiet --eval "db.getSiblingDB('docspot').doctors.find({isApproved:false}).count()"
        
        Write-Host "📊 Database Statistics:" -ForegroundColor Cyan
        Write-Host "   Total Doctor Accounts: $totalDoctors" -ForegroundColor White
        Write-Host "   Approved Doctors: $approvedDoctors" -ForegroundColor Green
        Write-Host "   Pending Approval: $pendingDoctors" -ForegroundColor Yellow
        
        if ($pendingDoctors -gt 0) {
            Write-Host "`n⚠️  You have $pendingDoctors doctor(s) pending approval!" -ForegroundColor Yellow
            Write-Host "   Login as admin to approve them" -ForegroundColor White
        }
    } catch {
        Write-Host "❌ Could not query MongoDB: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  mongosh not installed. To check database directly:" -ForegroundColor Yellow
    Write-Host "   Install MongoDB Shell from: https://www.mongodb.com/try/download/shell" -ForegroundColor White
}

# Quick actions
Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Quick Actions:" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "1. Register a new doctor:" -ForegroundColor White
Write-Host "   http://localhost:3000/register" -ForegroundColor Cyan
Write-Host "2. Login as admin:" -ForegroundColor White
Write-Host "   http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "   Email: admin@docspot.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host "3. View all doctors:" -ForegroundColor White
Write-Host "   http://localhost:3000/doctors" -ForegroundColor Cyan
Write-Host "4. Check API directly:" -ForegroundColor White
Write-Host "   http://localhost:5000/api/doctors/approved" -ForegroundColor Cyan

Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")