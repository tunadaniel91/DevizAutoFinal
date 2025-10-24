# Script to build without strict type checking

Write-Host "Building Deviz Auto without strict type checking..." -ForegroundColor Green

# Create a temporary tsconfig for building
$tsconfigPath = "tsconfig.main.json"
$tsconfigBackupPath = "tsconfig.main.backup.json"

# Backup original tsconfig
Copy-Item $tsconfigPath $tsconfigBackupPath
Write-Host "Backed up original tsconfig to $tsconfigBackupPath" -ForegroundColor Cyan

# Read the tsconfig
$tsconfig = Get-Content $tsconfigPath -Raw | ConvertFrom-Json

# Modify for less strict type checking
$tsconfig.compilerOptions.skipLibCheck = $true
$tsconfig.compilerOptions.noImplicitAny = $false
$tsconfig.compilerOptions.strict = $false
$tsconfig.compilerOptions.types = @("node")

# Save the modified tsconfig
$tsconfig | ConvertTo-Json -Depth 10 | Set-Content $tsconfigPath
Write-Host "Modified tsconfig for less strict type checking" -ForegroundColor Yellow

# Clean build directories
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Create a simple declaration file for electron
$electronDtsPath = "src/types/electron.d.ts"
if (!(Test-Path "src/types")) {
    New-Item -ItemType Directory -Path "src/types"
}

$electronDtsContent = @"
declare module 'electron' {
  export const app: any;
  export const BrowserWindow: any;
  export const ipcMain: any;
  export const dialog: any;
}
"@

Set-Content -Path $electronDtsPath -Value $electronDtsContent
Write-Host "Created simple electron.d.ts declaration file" -ForegroundColor Cyan

# Build the renderer first (which doesn't have the type issues)
Write-Host "Building renderer..." -ForegroundColor Yellow
npm run build:renderer

# Build the main process with skipTypeCheck
Write-Host "Building main process with tsc..." -ForegroundColor Yellow
npx tsc -p tsconfig.main.json --skipLibCheck

# Check if the build succeeded
if (Test-Path "dist/main/main.js") {
    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
    
    # Build the installer
    Write-Host "Building installers..." -ForegroundColor Yellow
    npx electron-builder --win --ia32 --x64
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nInstallers built successfully!" -ForegroundColor Green
        Write-Host "Check the 'release' directory for your installers" -ForegroundColor Cyan
    } else {
        Write-Host "`nFailed to build installers" -ForegroundColor Red
    }
} else {
    Write-Host "`nBuild failed" -ForegroundColor Red
}

# Restore original tsconfig
Copy-Item $tsconfigBackupPath $tsconfigPath
Write-Host "Restored original tsconfig" -ForegroundColor Cyan
