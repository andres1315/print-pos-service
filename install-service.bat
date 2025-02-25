@echo off
:: Verifica si el script se está ejecutando con permisos de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Moviéndose a la carpeta del script...
    cd /d %~dp0
    echo Ejecutando npm run install-service...
    npm run install-service
) else (
    echo Solicitando permisos de administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c %~dp0install-service.bat' -Verb RunAs"
)
pause