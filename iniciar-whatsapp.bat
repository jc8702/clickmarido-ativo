@echo off
title Inicializador Click Marido - WhatsApp Hub
echo =======================================================
echo     INICIALIZADOR DO SERVICO DE WHATSAPP LOCAL
echo =======================================================
echo.

docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] O Docker nao esta instalado ou nao esta no PATH do sistema.
    echo Por favor, instale o Docker Desktop antes de prosseguir.
    pause
    exit /b
)

echo [+] Iniciando Evolution API local com persistencia de conexao...
docker compose up -d evolution-api

if errorlevel 1 (
    echo.
    echo [AVISO] Falha ao rodar com docker compose. Tentando docker run alternativo...
    docker volume create evolution_instances >nul 2>&1
    docker run -d --name evolution-api -p 8080:8080 -e AUTHENTICATION_API_KEY=clickmarido_key -e TEMPLATE_ENABLED=true -v evolution_instances:/evolution/instances --restart unless-stopped evoapicloud/evolution-api:v1.8.2
)

echo.
echo =======================================================
echo  [SUCESSO] Servico de WhatsApp iniciado com sucesso!
echo  Suas credenciais de login serao salvas no computador.
echo  Pode fechar esta janela agora.
echo =======================================================
echo.
pause
