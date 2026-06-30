-- AddLeadDataToQuotation: Adiciona dados de origem do lead ao orçamento para rastreabilidade

-- Adicionar colunas de dados do lead
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "leadId" TEXT;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "leadSourceChannel" VARCHAR(50);
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "leadSourceCampaign" VARCHAR(100);
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "leadPriority" VARCHAR(20) DEFAULT 'MEDIA';
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "leadScore" INTEGER DEFAULT 0;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "leadIntention" TEXT;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "leadQualification" TEXT;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "leadResponsavelId" TEXT;

-- Criar índice para leadId
CREATE INDEX IF NOT EXISTS "quotations_leadId_idx" ON "quotations"("leadId");
