-- Apply RLS policies on tables
ALTER TABLE public.ashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t text;
    tables text[] := ARRAY['ashes', 'borrow_records', 'events', 'inventory', 'menu_items', 'monks', 'ranks', 'settings', 'transactions', 'users'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "Allow select for authenticated" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow update for authenticated" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.%I', t);
        
        -- Create policies for authenticated
        EXECUTE format('CREATE POLICY "Allow select for authenticated" ON public.%I FOR SELECT TO authenticated USING (true)', t);
        EXECUTE format('CREATE POLICY "Allow insert for authenticated" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t);
        EXECUTE format('CREATE POLICY "Allow update for authenticated" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t);
        EXECUTE format('CREATE POLICY "Allow delete for authenticated" ON public.%I FOR DELETE TO authenticated USING (true)', t);
    END LOOP;
    
    -- Special policies for anonymous access
    DROP POLICY IF EXISTS "Allow select for anonymous" ON public.settings;
    CREATE POLICY "Allow select for anonymous" ON public.settings FOR SELECT TO anon USING (true);

    DROP POLICY IF EXISTS "Allow select for anonymous" ON public.menu_items;
    CREATE POLICY "Allow select for anonymous" ON public.menu_items FOR SELECT TO anon USING (true);

    DROP POLICY IF EXISTS "Allow select for anonymous" ON public.ranks;
    CREATE POLICY "Allow select for anonymous" ON public.ranks FOR SELECT TO anon USING (true);
END $$;
