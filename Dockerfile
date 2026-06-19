# Dockerfile opcional para testar ambiente de produção localmente
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências globais
RUN npm install -g typescript

# Copiar arquivos de configuração raiz
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copiar workspaces
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Instalar dependências (workspaces)
RUN npm install

# Copiar código fonte
COPY . .

# Build dos workspaces
RUN npm run build -ws

# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Apenas dependências de produção para o backend (simulando o Glitch)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm install --omit=dev --workspace=backend

# Copiar build do backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/.env* ./backend/

# No Glitch, ele roda o script start diretamente no root do backend
# Para o backend Glitch start: node dist/main.js
EXPOSE 3001
CMD ["npm", "run", "start", "-w", "backend"]
