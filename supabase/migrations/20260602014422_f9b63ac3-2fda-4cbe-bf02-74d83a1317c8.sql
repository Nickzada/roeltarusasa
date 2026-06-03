
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS qr_code_text text;

CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id);
