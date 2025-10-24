# Script to fix import issues in the project

Write-Host "Fixing import issues in Deviz Auto..." -ForegroundColor Green

# Update App.tsx to use relative imports instead of @ alias
$appTsxPath = "src/renderer/App.tsx"
if (Test-Path $appTsxPath) {
    Write-Host "Updating App.tsx imports..." -ForegroundColor Yellow
    
    $content = Get-Content $appTsxPath -Raw
    
    # Replace @ imports with relative imports
    $content = $content -replace 'from "../components/ui/', 'from "../components/ui/'
    $content = $content -replace 'from "@/components/ui/', 'from "../components/ui/'
    $content = $content -replace 'from "@/lib/', 'from "../lib/'
    
    Set-Content $appTsxPath $content
    Write-Host "Updated App.tsx imports" -ForegroundColor Green
}

# Check if components directory exists in the right place
if (!(Test-Path "src/components")) {
    Write-Host "Components directory not found. Creating it..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "src/components/ui" -Force | Out-Null
    
    # Copy UI components from the existing location if they exist elsewhere
    if (Test-Path "components") {
        Copy-Item "components/*" "src/components/" -Recurse -Force
        Write-Host "Copied components to src/components/" -ForegroundColor Green
    }
}

# Check if lib directory exists
if (!(Test-Path "src/lib")) {
    Write-Host "Lib directory not found. Creating it..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "src/lib" -Force | Out-Null
    
    # Copy lib files if they exist elsewhere
    if (Test-Path "lib") {
        Copy-Item "lib/*" "src/lib/" -Recurse -Force
        Write-Host "Copied lib files to src/lib/" -ForegroundColor Green
    }
}

Write-Host "Import fixes completed!" -ForegroundColor Green
Write-Host "Now try running: .\quick-build.ps1" -ForegroundColor Cyan
