# Script to fix build issues and install missing dependencies

Write-Host "Fixing build issues for Deviz Auto..." -ForegroundColor Green

# Install PDFKit type definitions
Write-Host "Installing @types/pdfkit..." -ForegroundColor Yellow
npm install --save-dev @types/pdfkit

# Create types directory if it doesn't exist
if (!(Test-Path "src/types")) {
    New-Item -ItemType Directory -Path "src/types"
    Write-Host "Created types directory" -ForegroundColor Cyan
}

# Check if better-sqlite3 is properly installed
Write-Host "Checking better-sqlite3 installation..." -ForegroundColor Yellow
$betterSqliteInstalled = npm list better-sqlite3 | Select-String "better-sqlite3"
if (!$betterSqliteInstalled) {
    Write-Host "Reinstalling better-sqlite3..." -ForegroundColor Yellow
    npm uninstall better-sqlite3
    npm install better-sqlite3
}

# Rebuild native modules for Electron
Write-Host "Rebuilding native modules for Electron..." -ForegroundColor Yellow
npx electron-rebuild

# Clean build directories
Write-Host "Cleaning build directories..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Try building again
Write-Host "Attempting to build the application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild fixed successfully!" -ForegroundColor Green
    Write-Host "You can now run 'npm run dist:all' to create the installers" -ForegroundColor Cyan
} else {
    Write-Host "`nBuild still has issues. Please check the error messages above." -ForegroundColor Red
}
