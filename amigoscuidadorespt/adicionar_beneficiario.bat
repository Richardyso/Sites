@echo off
chcp 65001 >nul
echo ========================================
echo   Adicionar Campo Beneficiário
echo ========================================
echo.
echo Executando script para adicionar informações
echo de beneficiário aos clientes existentes...
echo.

cd backend
node scripts/add-care-recipient.js

echo.
echo ========================================
pause

