# PowerShell script to seed MongoDB with initial data
Write-Host "Seeding MongoDB with initial data for CRM System..." -ForegroundColor Cyan

# Navigate to the backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Check if MongoDB is running
Write-Host "Checking MongoDB status..." -ForegroundColor Yellow
node start-mongodb.js

# Check if the MongoDB check was successful
if ($LASTEXITCODE -eq 0) {
    # Run the seeding script
    Write-Host "`nRunning data seeding script..." -ForegroundColor Green
    node scripts/seedInitialData.js
    
    Write-Host "`nData seeding process complete." -ForegroundColor Cyan
    Write-Host "You can now start the backend server with: .\start-mongodb-server.ps1" -ForegroundColor Cyan
} else {
    Write-Host "`nMongoDB check failed. Cannot seed data without MongoDB running." -ForegroundColor Red
    Write-Host "Please ensure MongoDB is running before attempting to seed data." -ForegroundColor Yellow
}

# Keep the window open if there's an error
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nPress any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} 