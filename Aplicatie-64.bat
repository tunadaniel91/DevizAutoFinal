@echo off
title Deviz Auto - Build x64
echo ====================================
echo   🧹 Curățare build anterior...
echo ====================================
rmdir /S /Q dist

echo.
echo ====================================
echo   🔨 Compilare aplicație (build)...
echo ====================================
npm run build

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Eroare la compilare. Verifică codul sursă!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================
echo   📦 Creare installer Windows x64...
echo ====================================
npm run dist:x64

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Eroare la generarea installerului!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ✅ GATA! Installerul se află în folderul: dist\
echo ====================================
pause
