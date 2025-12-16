@echo off
echo ========================================
echo   IMPORTACAO DE USUARIOS PARA FIRESTORE
echo ========================================
echo.

cd /d "%~dp0backend"

echo Executando script de importacao...
node scripts\import-users.js

if %errorlevel% neq 0 (
  echo.
  echo Ocorreu um erro durante a importacao. Veja as mensagens acima.
) else (
  echo.
  echo Importacao concluida com sucesso!
)

echo.
pause

