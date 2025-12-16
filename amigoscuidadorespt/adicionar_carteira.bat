@echo off
echo ========================================
echo  Adicionar Carteira aos Usuarios
echo ========================================
echo.

cd backend
node scripts\add-wallet-to-users.js

echo.
echo ========================================
echo  Pressione qualquer tecla para sair
echo ========================================
pause >nul

