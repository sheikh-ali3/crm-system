# PowerShell script to check MongoDB and start the backend server
Write-Host "Starting CRM System with MongoDB..." -ForegroundColor Cyan

# Navigate to the backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Check if MongoDB is running
Write-Host "Checking MongoDB status..." -ForegroundColor Yellow
node start-mongodb.js

# Check if the MongoDB check was successful
if ($LASTEXITCODE -eq 0) {
    # Start the backend server
    Write-Host "`nStarting backend server..." -ForegroundColor Green
    npm start
} else {
    Write-Host "`nMongoDB check failed. Please ensure MongoDB is running before starting the server." -ForegroundColor Red
    Write-Host "You can manually start the server with 'npm start' in the backend directory once MongoDB is running." -ForegroundColor Yellow
    
    # Ask if user wants to start with mock database
    $useMock = Read-Host "Would you like to start with mock database instead? (y/n)"
    if ($useMock -eq "y") {
        Write-Host "Setting USE_MOCK_DB=true in .env file..." -ForegroundColor Yellow
        
        # Read current .env file
        $envContent = Get-Content -Path ".\.env" -Raw
        
        # Replace USE_MOCK_DB line
        $envContent = $envContent -replace "USE_MOCK_DB=false", "USE_MOCK_DB=true"
        
        # Write back to .env file
        $envContent | Set-Content -Path ".\.env"
        
        # Start the backend server with mock database
        Write-Host "`nStarting backend server with mock database..." -ForegroundColor Green
        npm start
    }
}

# Keep the window open if there's an error
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nPress any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} 