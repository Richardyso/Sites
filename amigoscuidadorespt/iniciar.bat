@echo off
echo ========================================
echo   INICIANDO AMIGOS CUIDADORES
echo ========================================
echo.

echo [1/2] Iniciando Backend (porta 5000)...
cd backend
start /B node server.js

echo [2/2] Aguardando backend iniciar...
timeout /t 3 /nobreak > nul

cd ..
echo.
echo ========================================
echo   SERVIDORES INICIADOS!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Para parar, feche esta janela
echo ========================================
echo.

echo [3/3] Iniciando Frontend (porta 3000)...
python -m http.server 3000
