#!/bin/bash

# ============================================================================
# MÓDULO DE SERVIÇOS E PRODUTOS - SCRIPT DE IMPLEMENTAÇÃO
# Click Marido CRM
# ============================================================================
# Este script automatiza a implementação do módulo de cadastro de 
# serviços/produtos com integração a orçamentos.
#
# USO:
#   chmod +x IMPLEMENTAR_MODULO.sh
#   ./IMPLEMENTAR_MODULO.sh
#
# ============================================================================

set -e  # Exit on error

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${COLOR_BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${COLOR_BLUE}║  MÓDULO DE SERVIÇOS E PRODUTOS - IMPLEMENTAÇÃO                  ║${NC}"
echo -e "${COLOR_BLUE}║  Click Marido CRM v1.0.0                                        ║${NC}"
echo -e "${COLOR_BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Validar ambiente
echo -e "${COLOR_YELLOW}[1/5] Validando ambiente...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${COLOR_RED}✗ Node.js não encontrado. Instale Node.js 18+${NC}"
    exit 1
fi
echo -e "${COLOR_GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${COLOR_RED}✗ npm não encontrado${NC}"
    exit 1
fi
echo -e "${COLOR_GREEN}✓ npm $(npm -v)${NC}"

# Step 2: Atualizar schema Prisma
echo ""
echo -e "${COLOR_YELLOW}[2/5] Atualizando schema Prisma...${NC}"

# Verificar se arquivo de schema existe
if [ ! -f "frontend/prisma/schema.prisma" ]; then
    echo -e "${COLOR_RED}✗ frontend/prisma/schema.prisma não encontrado${NC}"
    exit 1
fi

echo -e "${COLOR_GREEN}✓ schema.prisma validado${NC}"

# Step 3: Instalar dependências
echo ""
echo -e "${COLOR_YELLOW}[3/5] Instalando/atualizando dependências...${NC}"
cd frontend
npm install --legacy-peer-deps
echo -e "${COLOR_GREEN}✓ Dependências instaladas${NC}"

# Step 4: Executar migração Prisma
echo ""
echo -e "${COLOR_YELLOW}[4/5] Executando migração do banco de dados...${NC}"
echo -e "${COLOR_YELLOW}     Isso criará a tabela 'quotation_items'${NC}"
echo -e "${COLOR_YELLOW}     Certifique-se de que DATABASE_URL está configurada${NC}"

if npx prisma migrate dev --name add_quotation_items_table; then
    echo -e "${COLOR_GREEN}✓ Migração concluída com sucesso${NC}"
else
    echo -e "${COLOR_YELLOW}⚠ Migração criada localmente. Execute 'npx prisma migrate deploy' em produção${NC}"
fi

# Step 5: Validar build
echo ""
echo -e "${COLOR_YELLOW}[5/5] Validando TypeScript e build...${NC}"

if npm run build > /tmp/build.log 2>&1; then
    echo -e "${COLOR_GREEN}✓ Build concluído com sucesso${NC}"
else
    echo -e "${COLOR_RED}✗ Erro no build TypeScript${NC}"
    echo -e "${COLOR_RED}Veja detalhes em: /tmp/build.log${NC}"
    exit 1
fi

cd ..

# Success message
echo ""
echo -e "${COLOR_GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${COLOR_GREEN}║                   ✓ IMPLEMENTAÇÃO CONCLUÍDA                   ║${NC}"
echo -e "${COLOR_GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${COLOR_BLUE}Próximos passos:${NC}"
echo ""
echo -e "1. ${COLOR_YELLOW}Revisar as mudanças no código:${NC}"
echo "   - frontend/app/api/products/[id]/route.ts"
echo "   - frontend/app/api/products/available/route.ts (NOVO)"
echo "   - frontend/app/api/quotation-items/route.ts (NOVO)"
echo "   - frontend/app/api/quotation-items/[id]/route.ts (NOVO)"
echo "   - frontend/components/quotations/ProductPicker.tsx (NOVO)"
echo "   - frontend/components/quotations/QuotationItemsTable.tsx (NOVO)"
echo "   - frontend/hooks/useQuotationItems.ts (NOVO)"
echo ""
echo -e "2. ${COLOR_YELLOW}Atualizar página de novo orçamento:${NC}"
echo "   frontend/app/(dashboard)/quotations/new/page.tsx"
echo "   → Adicionar ProductPicker modal"
echo "   → Substituir items JSON por QuotationItemsTable"
echo ""
echo -e "3. ${COLOR_YELLOW}Atualizar página de visualização de orçamento:${NC}"
echo "   frontend/app/(dashboard)/quotations/[id]/page.tsx"
echo "   → Renderizar items como relação normalizada"
echo ""
echo -e "4. ${COLOR_YELLOW}Testar fluxo completo:${NC}"
echo "   npm run dev"
echo "   → Criar novo produto"
echo "   → Criar novo orçamento"
echo "   → Adicionar produtos via ProductPicker"
echo ""
echo -e "5. ${COLOR_YELLOW}Deploy:${NC}"
echo "   git add ."
echo "   git commit -m 'feat: adicionar módulo de serviços e produtos'"
echo "   git push origin main"
echo ""
echo -e "${COLOR_GREEN}Documentação completa: MODULO_SERVICOS_DOCUMENTACAO.md${NC}"
echo ""