# Development setup script for Deviz Auto
Write-Host "Setting up Deviz Auto development environment..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Install electron-builder globally for easier access
Write-Host "Installing electron-builder globally..." -ForegroundColor Yellow
npm install -g electron-builder

# Create necessary directories
$directories = @("build", "release", "dist")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir
        Write-Host "Created directory: $dir" -ForegroundColor Cyan
    }
}

Write-Host "`nDevelopment environment setup complete!" -ForegroundColor Green
Write-Host "`nAvailable commands:" -ForegroundColor Yellow
Write-Host "  npm run dev          - Start development server" -ForegroundColor White
Write-Host "  npm run build        - Build the application" -ForegroundColor White
Write-Host "  npm run dist         - Create installer" -ForegroundColor White
Write-Host "  npm run dist:win32   - Create 32-bit installer" -ForegroundColor White
Write-Host "  npm run dist:win64   - Create 64-bit installer" -ForegroundColor White
Write-Host "  npm run dist:all     - Create both installers" -ForegroundColor White
Write-Host "`nOr use the PowerShell script:" -ForegroundColor Yellow
Write-Host "  .\build-installer.ps1 all    - Build both installers" -ForegroundColor White
Write-Host "  .\build-installer.ps1 32     - Build 32-bit only" -ForegroundColor White
Write-Host "  .\build-installer.ps1 64     - Build 64-bit only" -ForegroundColor White
