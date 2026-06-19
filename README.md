# CRM Serviços Residenciais (Blumenau, BR)

Monorepo contendo a estrutura para Next.js 15 (Frontend) e NestJS 11 (Backend).

## 🚀 Setup Inicial

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Subir Banco de Dados e Redis Local**
   ```bash
   docker-compose up -d
   ```

3. **Configurar Variáveis de Ambiente**
   Copie o `.env.example` para `.env` e configure de acordo.

4. **Rodar em Desenvolvimento**
   ```bash
   npm run dev
   ```
   *(Inicia o Next.js na 3000 e NestJS na 3001 simultaneamente)*

## 🌐 Deploy Glitch (Backend)

O Glitch é utilizado para hospedar o backend NestJS gratuitamente 24/7.
- **Node Version**: Certifique-se de configurar a engine correta no `backend/package.json` ou usar `.nvmrc`.
- **Start Script**: O Glitch procurará pelo script `"start"` no package.json. O script deve ser algo como `"start": "node dist/main.js"`. 
- **.env**: Configure as variáveis de ambiente diretamente na UI do Glitch. Não commite seu arquivo `.env`.
- **Keep-alive**: Configure um ping no [UptimeRobot](https://uptimerobot.com) a cada 4 horas para a URL do seu Glitch para mantê-lo acordado.

## ⚡ Deploy Vercel (Frontend)

O frontend em Next.js é configurado para deploy automático na Vercel.
- Crie um novo projeto na Vercel importando este repositório.
- Defina o "Root Directory" como `frontend`.
- Defina as variáveis de ambiente, principalmente `NEXT_PUBLIC_API_URL` apontando para o seu Glitch.
