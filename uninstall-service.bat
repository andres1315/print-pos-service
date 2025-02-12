@echo off
:: Verifica si el script se está ejecutando con permisos de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Ejecutando npm run uninstall-service...
    npm run uninstall-service
) else (
    echo Solicitando permisos de administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c uninstall-service.bat' -Verb RunAs"
)
pause