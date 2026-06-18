-- Visibilidade no catálogo público (além de com stock / sem stock)
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS disponivel_catalogo boolean DEFAULT true;
