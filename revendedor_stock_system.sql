-- =====================================================================
-- AURA SCENTRA — Sistema de Revendedor com Stock + Requisições
-- Executar no SQL Editor do Lovable Cloud (Supabase)
-- =====================================================================

-- 1) Novos campos em produtos
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS preco_revendedor numeric,
  ADD COLUMN IF NOT EXISTS preco_venda_sugerido numeric,
  ADD COLUMN IF NOT EXISTS qty_minima_revenda int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS disponivel_com_stock boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS disponivel_sem_stock boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS disponivel_catalogo boolean DEFAULT true;

-- 2) Tipo de nhoguista (sem_stock vs com_stock)
ALTER TABLE public.nhoguistas
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'sem_stock';

DO $$ BEGIN
  ALTER TABLE public.nhoguistas
    ADD CONSTRAINT nhoguistas_tipo_check CHECK (tipo IN ('sem_stock','com_stock'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Tabela de requisições
CREATE TABLE IF NOT EXISTS public.requisicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nhoguista_id uuid REFERENCES public.nhoguistas(id) ON DELETE SET NULL,
  nhoguista_codigo text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome_revendedor text,
  telefone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_estimado numeric DEFAULT 0,
  observacao text,
  status text DEFAULT 'pendente'
    CHECK (status IN ('pendente','aprovada','entregue','cancelada')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requisicoes_user ON public.requisicoes(user_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_status ON public.requisicoes(status);
CREATE INDEX IF NOT EXISTS idx_requisicoes_nhoguista ON public.requisicoes(nhoguista_codigo);

-- 4) Permissões + RLS
GRANT SELECT, INSERT, UPDATE ON public.requisicoes TO authenticated;
GRANT ALL ON public.requisicoes TO service_role;

ALTER TABLE public.requisicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rev vê suas requisições" ON public.requisicoes;
CREATE POLICY "rev vê suas requisições" ON public.requisicoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "rev cria requisições" ON public.requisicoes;
CREATE POLICY "rev cria requisições" ON public.requisicoes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin actualiza requisições" ON public.requisicoes;
CREATE POLICY "admin actualiza requisições" ON public.requisicoes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 5) Realtime — para notificações em tempo real (popup)
ALTER PUBLICATION supabase_realtime ADD TABLE public.requisicoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;

-- =====================================================================
-- Concluído.
-- =====================================================================