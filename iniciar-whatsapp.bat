@echo off
cd /d "%~dp0"
echo ========================================
echo   Click Marido - WhatsApp Local Setup
echo ========================================
echo.

rem === Variaveis de Ambiente Locais ===
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_db
set JWT_SECRET=clickmarido_local_secret_2026
set NEXT_PUBLIC_WHATSAPP_API_URL=http://localhost:8080
set NEXT_PUBLIC_WHATSAPP_API_KEY=clickmarido_key

rem === [1/3] Iniciando PostgreSQL, Redis e Evolution API (Docker) ===
echo [1/3] Iniciando Docker (PostgreSQL, Redis, Evolution API)...
docker-compose up -d
echo Aguardando 5 segundos para o PostgreSQL inicializar...
timeout /t 5 /nobreak >nul
echo.

rem === [2/3] Verificando banco de dados ===
echo [2/3] Verificando banco de dados local...
cd frontend
npx prisma migrate deploy 2>nul
if %errorlevel% neq 0 (
    echo   Aplicando schema ao banco local...
    npx prisma db push 2>nul
    node prisma/seed-local-user.js 2>nul
)
echo.

rem === [3/3] Iniciando Frontend ===
echo [3/3] Iniciando Frontend (Next.js)...
echo.
echo ========================================
echo   Acesse: http://localhost:3000/chat
echo   Login: clickmarido@gmail.com
echo    Senha: Millena@@2017@@
echo ========================================
echo.
npm run dev
