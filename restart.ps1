# Kill any process using port 5000
Write-Host "Looking for processes using port 5000..."
$processInfo = netstat -ano | findstr :5000

if ($processInfo) {
    $processInfo | ForEach-Object {
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

# Kill any process using port 3000 (frontend)
Write-Host "Looking for processes using port 3000..."
$processInfo = netstat -ano | findstr :3000

if ($processInfo) {
    $processInfo | ForEach-Object {
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

Write-Host "Starting backend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd './backend'; npm run dev"

Write-Host "Starting frontend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd './frontend'; npm start"

Write-Host "System restarted. Backend and frontend servers should be running." 