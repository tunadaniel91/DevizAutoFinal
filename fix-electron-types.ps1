# Script to fix Electron type definitions issue

Write-Host "Fixing Electron type definitions for Deviz Auto..." -ForegroundColor Green

# Create types directory if it doesn't exist
if (!(Test-Path "src/types")) {
    New-Item -ItemType Directory -Path "src/types"
    Write-Host "Created types directory" -ForegroundColor Cyan
}

# Update tsconfig.main.json to remove electron from types array
Write-Host "Updating tsconfig.main.json..." -ForegroundColor Yellow
$tsconfigPath = "tsconfig.main.json"
$tsconfig = Get-Content $tsconfigPath -Raw | ConvertFrom-Json

# Update types array to only include node
$tsconfig.compilerOptions.types = @("node")

# Make sure typeRoots includes our custom types
if (-not $tsconfig.compilerOptions.typeRoots) {
    $tsconfig.compilerOptions | Add-Member -Name "typeRoots" -Value @("./node_modules/@types", "./src/types") -MemberType NoteProperty
} else {
    $tsconfig.compilerOptions.typeRoots = @("./node_modules/@types", "./src/types")
}

# Save the updated tsconfig
$tsconfig | ConvertTo-Json -Depth 10 | Set-Content $tsconfigPath

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
