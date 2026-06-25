# Dockerfile para o Click Marido CRM
# Projeto: Next.js 15 (frontend com API Routes) + Prisma + PostgreSQL (Neon)
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências nativas necessárias para bcrypt
RUN apk add --no-cache python3 make g++

# Copiar package files
COPY frontend/package.json ./

# Instalar todas as dependências (incluindo dev para o build)
RUN npm install --legacy-peer-deps

# Copiar código fonte completo
COPY frontend/ .

# Build (já inclui prisma generate via script build)
RUN npm run build

# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copiar output standalone do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copiar prisma para runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
