CREATE TYPE public.app_role AS ENUM ('admin','client');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'client') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE TABLE public.service_rates (
  service_key text PRIMARY KEY,
  label text NOT NULL,
  unit_label text NOT NULL DEFAULT 'page',
  base_rate numeric NOT NULL,
  floor_price numeric NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_rates TO anon, authenticated;
GRANT UPDATE ON public.service_rates TO authenticated;
GRANT ALL ON public.service_rates TO service_role;
ALTER TABLE public.service_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read rates" ON public.service_rates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin update rates" ON public.service_rates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.service_rates(service_key,label,unit_label,base_rate,floor_price,sort_order) VALUES
('engineering','Engineering Projects','sheet / page',60,250,1),
('it','IT Services','task unit',80,150,2),
('research','Academic Research Support','page',25,200,3),
('assignment','Assignments & Typing','page',5,30,4);

CREATE TABLE public.pricing_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  complexity_standard numeric NOT NULL DEFAULT 1,
  complexity_advanced numeric NOT NULL DEFAULT 1.4,
  complexity_expert numeric NOT NULL DEFAULT 1.9,
  urgency_24h_pct numeric NOT NULL DEFAULT 60,
  urgency_72h_pct numeric NOT NULL DEFAULT 30,
  urgency_7d_pct numeric NOT NULL DEFAULT 10,
  print_per_page numeric NOT NULL DEFAULT 1,
  binding_base numeric NOT NULL DEFAULT 10,
  binding_per_50_pages numeric NOT NULL DEFAULT 5,
  returning_discount_pct numeric NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_settings TO anon, authenticated;
GRANT UPDATE ON public.pricing_settings TO authenticated;
GRANT ALL ON public.pricing_settings TO service_role;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.pricing_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin update settings" ON public.pricing_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.pricing_settings(id) VALUES (1);

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  user_id uuid,
  order_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read clients" ON public.clients FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text NOT NULL UNIQUE,
  user_id uuid,
  client_id uuid REFERENCES public.clients(id),
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  service_key text NOT NULL,
  delivery_format text NOT NULL DEFAULT 'soft',
  quantity int NOT NULL DEFAULT 1,
  complexity text NOT NULL DEFAULT 'standard',
  deadline timestamptz NOT NULL,
  notes text,
  amount numeric NOT NULL,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_repeat boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'received',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_ref text,
  amount_paid numeric NOT NULL DEFAULT 0,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read events" ON public.order_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.order_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'input',
  path text NOT NULL,
  name text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_files TO authenticated;
GRANT ALL ON public.order_files TO service_role;
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read files" ON public.order_files FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

CREATE POLICY "anyone upload incoming" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'order-files' AND (storage.foldername(name))[1] = 'incoming');
CREATE POLICY "admin manage order files" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'order-files' AND public.has_role(auth.uid(),'admin')) WITH CHECK (bucket_id = 'order-files' AND public.has_role(auth.uid(),'admin'));