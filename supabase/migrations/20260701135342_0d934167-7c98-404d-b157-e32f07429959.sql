CREATE TABLE public.web_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL CHECK (metric_name IN ('LCP','CLS','INP','FCP','TTFB')),
  value DOUBLE PRECISION NOT NULL CHECK (value >= 0 AND value <= 600000),
  rating TEXT NOT NULL CHECK (rating IN ('good','needs-improvement','poor')),
  path TEXT NOT NULL,
  ua TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.web_vitals TO authenticated;
GRANT ALL ON public.web_vitals TO service_role;
ALTER TABLE public.web_vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vitals_no_direct_client_writes" ON public.web_vitals FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX web_vitals_created_at_idx ON public.web_vitals (created_at DESC);
CREATE INDEX web_vitals_name_idx ON public.web_vitals (metric_name, created_at DESC);