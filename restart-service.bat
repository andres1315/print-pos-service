REM filepath: /C:/print-pos-service/restart-service.bat
@echo off
:: Verifica si el script se está ejecutando con permisos de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Moviéndose a la carpeta del script...
    cd /d %~dp0
    echo Deteniendo el servicio...
    net stop "PrinterServiceThermal"
    echo Iniciando el servicio...
    net start "PrinterServiceThermal"
) else (
    echo Solicitando permisos de administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c restart-service.bat' -Verb RunAs"
)
pause