# Script to start the CRM system with proper port configuration

# First kill any existing processes on port 5000 or 3000
Write-Host "Looking for processes using port 5000..."
$portInfo = netstat -ano | findstr :5000

if ($portInfo) {
    $portInfo | ForEach-Object {
        $_ -match ":5000\s+.*LISTENING\s+(\d+)" | Out-Null
        if ($matches -and $matches[1]) {
            $processId = $matches[1]
            $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
            
            if ($processName) {
                Write-Host "Found process using port 5000 - PID: $processId, Name: $processName"
                Write-Host "Killing process $processId ($processName)..."
                Stop-Process -Id $processId -Force
                Write-Host "Process killed."
            }
        }
    }
} else {
    Write-Host "No process found using port 5000."
}

Write-Host "Looking for processes using port 3000..."
$portInfo = netstat -ano | findstr :3000

if ($portInfo) {
    $portInfo | ForEach-Object {
        $_ -match ":3000\s+.*LISTENING\s+(\d+)" | Out-Null
        if ($matches -and $matches[1]) {
            $processId = $matches[1]
            $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
            
            if ($processName) {
                Write-Host "Found process using port 3000 - PID: $processId, Name: $processName"
                Write-Host "Killing process $processId ($processName)..."
                Stop-Process -Id $processId -Force
                Write-Host "Process killed."
            }
        }
    }
} else {
    Write-Host "No process found using port 3000."
}

# Delete any existing PORT file
if (Test-Path "./backend/PORT") {
    Remove-Item "./backend/PORT"
}

# Start backend server
Write-Host "Starting backend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd './backend'; npm run dev" -WindowStyle Normal

# Wait for the backend to start and determine which port it's using
Write-Host "Waiting for backend server to start..."
$startTime = Get-Date
$portFileExists = $false
$backendPort = 5000  # Default

# Wait up to 30 seconds for the PORT file to be created
while (((Get-Date) - $startTime).TotalSeconds -lt 30 -and -not $portFileExists) {
    if (Test-Path "./backend/PORT") {
        $portFileExists = $true
        $backendPort = Get-Content "./backend/PORT"
        Write-Host "Backend is running on port $backendPort (detected from PORT file)"
    } else {
        Start-Sleep -Seconds 1
    }
}

# If PORT file wasn't created, try to detect the port
if (-not $portFileExists) {
    Write-Host "PORT file not found, checking ports manually..."
    $portInfo = netstat -ano | findstr :5000
    
    if (-not $portInfo) {
        Write-Host "Port 5000 is not in use, checking alternative port 50001..."
        $portInfo = netstat -ano | findstr :50001
        
        if ($portInfo) {
            $backendPort = 50001
            Write-Host "Backend is running on port 50001 (detected from netstat)"
        } else {
            Write-Host "Unable to determine backend port, defaulting to 5000"
        }
    } else {
        Write-Host "Backend is running on port 5000 (detected from netstat)"
    }
}

# Update frontend .env file with the correct port
Write-Host "Updating frontend .env file with API URL: http://localhost:$backendPort"
Set-Content -Path "./frontend/.env" -Value "REACT_APP_API_URL=http://localhost:$backendPort"

# Start frontend server
Write-Host "Starting frontend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd './frontend'; npm start" -WindowStyle Normal

Write-Host "System started. Frontend should be available at http://localhost:3000"
Write-Host "Backend API is available at http://localhost:$backendPort"
Write-Host "Use the following credentials for login:"
Write-Host "  Super Admin: superadmin@example.com / superadmin123"
Write-Host "  Admin: admin@example.com / adminpassword" 