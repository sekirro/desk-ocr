$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$appPath = Join-Path $projectRoot "release\electron\win-unpacked\Desk OCR.exe"
$servicePath = Join-Path $projectRoot "release\electron\win-unpacked\resources\ocr\desk-ocr-service.exe"
$testImagePath = Join-Path $projectRoot "release\electron\packaged-smoke-test.png"
$healthUrl = "http://127.0.0.1:8787/health"
$debugPort = 9333

if (-not (Test-Path -LiteralPath $appPath)) {
    throw "Packaged application not found. Run npm run dist:win first."
}

$serviceWasRunning = $false
try {
    $null = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 1
    $serviceWasRunning = $true
} catch {
    $serviceWasRunning = $false
}

if ($serviceWasRunning) {
    throw "Port 8787 already has a healthy service. Stop it before running the packaged smoke test."
}

Add-Type -AssemblyName System.Drawing
$image = New-Object System.Drawing.Bitmap 1400, 360
$graphics = [System.Drawing.Graphics]::FromImage($image)
$font = New-Object System.Drawing.Font "Segoe UI", 46
$brush = [System.Drawing.Brushes]::Black
try {
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.DrawString("Packaged Desk OCR Search Test 2026", $font, $brush, 40, 60)
    $graphics.DrawString("Recognized text stays local", $font, $brush, 40, 180)
    $image.Save($testImagePath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $font.Dispose()
    $graphics.Dispose()
    $image.Dispose()
}

$appProcess = Start-Process -FilePath $appPath -ArgumentList "--remote-debugging-port=$debugPort" -WindowStyle Hidden -PassThru
try {
    $health = $null
    for ($attempt = 0; $attempt -lt 120; $attempt += 1) {
        try {
            $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 1
            break
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }

    if ($null -eq $health -or $health.status -ne "ok" -or $health.service -ne "desk-ocr") {
        throw "The packaged OCR service did not become healthy."
    }

    & node (Join-Path $projectRoot "scripts\check-packaged-bridge.mjs") "http://127.0.0.1:$debugPort"
    if ($LASTEXITCODE -ne 0) {
        throw "The packaged preload bridge check failed with exit code $LASTEXITCODE."
    }

    $ocrJson = & curl.exe --silent --show-error --fail --form "file=@$testImagePath;type=image/png" "http://127.0.0.1:8787/ocr"
    if ($LASTEXITCODE -ne 0) {
        throw "The packaged OCR request failed with curl exit code $LASTEXITCODE."
    }

    $ocr = $ocrJson | ConvertFrom-Json
    $recognizedText = ($ocr.lines | ForEach-Object { $_.text }) -join " "
    if ($recognizedText -notmatch "Desk OCR" -or $recognizedText -notmatch "stays local") {
        throw "Unexpected OCR result: $recognizedText"
    }

    [PSCustomObject]@{
        Health = "$($health.status)/$($health.service)"
        PreloadBridge = "ok"
        RecognizedText = $recognizedText
        Lines = $ocr.lines.Count
    } | Format-List
} finally {
    $appProcess.Refresh()
    if (-not $appProcess.HasExited) {
        $null = $appProcess.CloseMainWindow()
        if (-not $appProcess.WaitForExit(10000)) {
            Stop-Process -Id $appProcess.Id -Force
        }
    }

    for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
        try {
            $null = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 1
            Start-Sleep -Milliseconds 250
        } catch {
            break
        }
    }

    $serviceProcess = Get-CimInstance Win32_Process | Where-Object {
        $_.ExecutablePath -eq $servicePath
    }
    if ($serviceProcess) {
        $serviceProcess | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    }

    if (Test-Path -LiteralPath $testImagePath) {
        Remove-Item -LiteralPath $testImagePath -Force
    }
}
