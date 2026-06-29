-- CreateEnum
CREATE TYPE "LeadQualificationStage" AS ENUM ('QUALIFICADO', 'PARCIALMENTE_QUALIFICADO', 'EM_VALIDACAO', 'DESQUALIFICADO', 'SEM_VALIDACAO');

-- CreateEnum
CREATE TYPE "LeadIntention" AS ENUM ('PESQUISANDO', 'COMPARANDO', 'PRONTO_PARA_ORCAMENTO', 'PRONTO_PARA_FECHAMENTO', 'ACOMPANHAR_DEPOIS');

-- CreateEnum
CREATE TYPE "LeadNextAction" AS ENUM ('LIGAR', 'RESPONDER_WHATSAPP', 'ENVIAR_PROPOSTA', 'AGENDAR_VISITA', 'AGENDAR_REUNIAO', 'PEDIR_MAIS_INFORMACOES', 'NUTRIR_LEAD', 'ENCAMINHAR_ORCAMENTO', 'DESCARTAR');

-- CreateEnum
CREATE TYPE "LeadLossReason" AS ENUM ('SEM_ORCAMENTO', 'SEM_TIMING', 'SEM_NECESSIDADE', 'SEM_AUTORIDADE', 'FORA_DE_PERFIL', 'CONCORRENCIA', 'RETORNO_FUTURO', 'CONTATO_INVALIDO');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- AlterEnum: Convert existing string values to enum types
-- This is a data migration - convert existing string values before altering columns

-- Convert priority strings to LeadPriority enum
UPDATE "leads" SET "priority" = 'BAIXA' WHERE "priority" = 'BAIXA';
UPDATE "leads" SET "priority" = 'MEDIA' WHERE "priority" = 'MEDIA';
UPDATE "leads" SET "priority" = 'ALTA' WHERE "priority" = 'ALTA';
UPDATE "leads" SET "priority" = 'MEDIA' WHERE "priority" NOT IN ('BAIXA', 'MEDIA', 'ALTA');

-- Convert qualificationStage strings to LeadQualificationStage enum
UPDATE "leads" SET "qualificationStage" = 'QUALIFICADO' WHERE "qualificationStage" ILIKE 'qualificado';
UPDATE "leads" SET "qualificationStage" = 'PARCIALMENTE_QUALIFICADO' WHERE "qualificationStage" ILIKE 'parcialmente%';
UPDATE "leads" SET "qualificationStage" = 'EM_VALIDACAO' WHERE "qualificationStage" ILIKE 'em%validação';
UPDATE "leads" SET "qualificationStage" = 'DESQUALIFICADO' WHERE "qualificationStage" ILIKE 'desqualificado';
UPDATE "leads" SET "qualificationStage" = 'SEM_VALIDACAO' WHERE "qualificationStage" ILIKE 'ainda%';

-- Convert intention strings to LeadIntention enum
UPDATE "leads" SET "intention" = 'PESQUISANDO' WHERE "intention" ILIKE 'pesquisando%';
UPDATE "leads" SET "intention" = 'COMPARANDO' WHERE "intention" ILIKE 'comparando%';
UPDATE "leads" SET "intention" = 'PRONTO_PARA_ORCAMENTO' WHERE "intention" ILIKE 'pronto%orçamento';
UPDATE "leads" SET "intention" = 'PRONTO_PARA_FECHAMENTO' WHERE "intention" ILIKE 'pronto%fechamento';
UPDATE "leads" SET "intention" = 'ACOMPANHAR_DEPOIS' WHERE "intention" ILIKE 'acompanhar%';

-- Convert nextAction strings to LeadNextAction enum
UPDATE "leads" SET "nextAction" = 'LIGAR' WHERE "nextAction" ILIKE 'ligar';
UPDATE "leads" SET "nextAction" = 'RESPONDER_WHATSAPP' WHERE "nextAction" ILIKE 'responder%whatsapp';
UPDATE "leads" SET "nextAction" = 'ENVIAR_PROPOSTA' WHERE "nextAction" ILIKE 'enviar%proposta';
UPDATE "leads" SET "nextAction" = 'AGENDAR_VISITA' WHERE "nextAction" ILIKE 'agendar%visita';
UPDATE "leads" SET "nextAction" = 'AGENDAR_REUNIAO' WHERE "nextAction" ILIKE 'agendar%reunião';
UPDATE "leads" SET "nextAction" = 'PEDIR_MAIS_INFORMACOES' WHERE "nextAction" ILIKE 'pedir%informações';
UPDATE "leads" SET "nextAction" = 'NUTRIR_LEAD' WHERE "nextAction" ILIKE 'nutrir%';
UPDATE "leads" SET "nextAction" = 'ENCAMINHAR_ORCAMENTO' WHERE "nextAction" ILIKE 'encaminhar%orçamento';
UPDATE "leads" SET "nextAction" = 'DESCARTAR' WHERE "nextAction" ILIKE 'descartar';

-- Convert lossReason strings to LeadLossReason enum
UPDATE "leads" SET "lossReason" = 'SEM_ORCAMENTO' WHERE "lossReason" ILIKE 'sem%orçamento';
UPDATE "leads" SET "lossReason" = 'SEM_TIMING' WHERE "lossReason" ILIKE 'sem%timing';
UPDATE "leads" SET "lossReason" = 'SEM_NECESSIDADE' WHERE "lossReason" ILIKE 'sem%necessidade';
UPDATE "leads" SET "lossReason" = 'SEM_AUTORIDADE' WHERE "lossReason" ILIKE 'sem%autoridade';
UPDATE "leads" SET "lossReason" = 'FORA_DE_PERFIL' WHERE "lossReason" ILIKE 'fora%perfil';
UPDATE "leads" SET "lossReason" = 'CONCORRENCIA' WHERE "lossReason" ILIKE 'concorrência';
UPDATE "leads" SET "lossReason" = 'RETORNO_FUTURO' WHERE "lossReason" ILIKE 'retorno%futuro';
UPDATE "leads" SET "lossReason" = 'CONTATO_INVALIDO' WHERE "lossReason" ILIKE 'contato%inválido';

-- AlterTable: Drop old columns and add new enum columns
ALTER TABLE "leads" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "leads" ADD COLUMN "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIA';

ALTER TABLE "leads" DROP COLUMN IF EXISTS "qualificationStage";
ALTER TABLE "leads" ADD COLUMN "qualificationStage" "LeadQualificationStage" NOT NULL DEFAULT 'SEM_VALIDACAO';

ALTER TABLE "leads" ALTER COLUMN "intention" TYPE "LeadIntention" USING "intention"::text::"LeadIntention";
ALTER TABLE "leads" ALTER COLUMN "nextAction" TYPE "LeadNextAction" USING "nextAction"::text::"LeadNextAction";
ALTER TABLE "leads" ALTER COLUMN "lossReason" TYPE "LeadLossReason" USING "lossReason"::text::"LeadLossReason";

-- Add new columns for cadence and SLA tracking
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lastContactAt" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "nextFollowupAt" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "cadenceCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "cadenceInterval" INTEGER;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "riskAlert" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "riskAlertLevel" VARCHAR(20);

-- Add BANT fields
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "bantBudget" VARCHAR(50);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "bantAuthority" VARCHAR(50);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "bantNeed" VARCHAR(50);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "bantTiming" VARCHAR(50);

-- Add CHAMP fields
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "champChallenge" VARCHAR(50);
ALTER TABLE "leads" ADD COLUMN IF EXISTS "champMoney" VARCHAR(50);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "champPriority" VARCHAR(50);
