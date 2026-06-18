-- ============================================================
-- AURA SCENTRA — Troca de modo de Nhoguista (com aprovação)
-- Executar no SQL Editor do Lovable Cloud
-- ============================================================

ALTER TABLE public.nhoguistas
  ADD COLUMN IF NOT EXISTS troca_aprovada boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_pendente text;

DO $$ BEGIN
  ALTER TABLE public.nhoguistas
    ADD CONSTRAINT nhoguistas_tipo_pendente_check
    CHECK (tipo_pendente IS NULL OR tipo_pendente IN ('sem_stock','com_stock'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Permitir ao próprio revendedor pedir troca (UPDATE já permitido pelas policies existentes)
-- Nada mais a fazer.
