Write-Host "Debugging Dr. Prameela's Slots" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# Get doctor data from API
try {
    $doctors = Invoke-RestMethod -Uri "http://localhost:5000/api/doctors/approved"
    
    # Find Dr. Prameela
    $prameela = $doctors | Where-Object { $_.userId.name -like "*Prameela*" }
    
    if ($prameela) {
        Write-Host "`n✅ Found Dr. Prameela" -ForegroundColor Green
        Write-Host "Specialization: $($prameela.specialization)" -ForegroundColor White
        
        Write-Host "`nAvailable Slots:" -ForegroundColor Yellow
        $prameela.availableSlots | ForEach-Object {
            Write-Host "  Day: $($_.day)" -ForegroundColor White
            Write-Host "  Time: $($_.startTime) - $($_.endTime)" -ForegroundColor White
            Write-Host "  Available: $($_.isAvailable)" -ForegroundColor White
            Write-Host "  ---"
        }
        
        # Check if Friday exists
        $friday = $prameela.availableSlots | Where-Object { $_.day -eq "Friday" }
        if ($friday) {
            Write-Host "`n✅ Friday is configured!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Friday is NOT configured!" -ForegroundColor Red
            Write-Host "Available days: $($prameela.availableSlots.day -join ', ')" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Dr. Prameela not found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error fetching doctors: $_" -ForegroundColor Red
    Write-Host "Make sure backend is running on port 5000" -ForegroundColor Yellow
}