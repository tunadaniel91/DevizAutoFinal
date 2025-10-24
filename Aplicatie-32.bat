@echo off
title Deviz Auto - Build ia32 (Windows 32-bit)
cd /d "%~dp0"

echo ==========================================
echo   📁 Locație curentă: %cd%
echo   🧹 Curățare build anterior (dacă există)...
echo ==========================================

if exist dist (
    rmdir /S /Q dist
    echo ✔️ Folderul "dist" a fost șters.
) else (
    echo ℹ️ Nu a fost găsit folderul "dist". Continuăm.
)

echo.
echo ==========================================
echo   🔨 Compilare aplicație (npm run build)...
echo ==========================================
npm run build
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Eroare la compilare. Verifică fișierele!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================
echo   📦 Generare installer Windows 32-bit (npm run dist:ia32)...
echo ==========================================
npm run dist:ia32
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Eroare la generarea installerului!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ✅ GATA! Installerul pentru Windows 32-bit este în folderul dist\
echo ==========================================
pause
