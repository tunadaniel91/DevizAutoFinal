# PowerShell script to build Windows installer for both 32-bit and 64-bit
param(
    [string]$BuildType = "all"
)

Write-Host "Starting Deviz Auto build process..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: npm is not available" -ForegroundColor Red
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
if (Test-Path "release") {
    Remove-Item -Recurse -Force "release"
}

# Create build directory if it doesn't exist
if (!(Test-Path "build")) {
    New-Item -ItemType Directory -Path "build"
}

# Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed" -ForegroundColor Red
    exit 1
}

# Build installers based on BuildType parameter
switch ($BuildType.ToLower()) {
    "32" {
        Write-Host "Building 32-bit installer..." -ForegroundColor Yellow
        npm run dist:win32
    }
    "64" {
        Write-Host "Building 64-bit installer..." -ForegroundColor Yellow
        npm run dist:win64
    }
    "all" {
        Write-Host "Building installers for both architectures..." -ForegroundColor Yellow
        npm run dist:all
    }
    default {
        Write-Host "Invalid build type. Use: 32, 64, or all" -ForegroundColor Red
        exit 1
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Installer build failed" -ForegroundColor Red
    exit 1
}

# Display build results
Write-Host "`nBuild completed successfully!" -ForegroundColor Green
Write-Host "Installers created in the 'release' directory:" -ForegroundColor Cyan

if (Test-Path "release") {
    Get-ChildItem "release" -Filter "*.exe" | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  - $($_.Name) ($size MB)" -ForegroundColor White
    }
}

Write-Host "`nTo install the application:" -ForegroundColor Yellow
Write-Host "  1. Navigate to the 'release' folder" -ForegroundColor White
Write-Host "  2. Run the appropriate installer for your system:" -ForegroundColor White
Write-Host "     - For 64-bit Windows: *-x64.exe" -ForegroundColor White
Write-Host "     - For 32-bit Windows: *-ia32.exe" -ForegroundColor White
