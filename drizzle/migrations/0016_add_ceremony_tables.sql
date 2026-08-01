CREATE TABLE IF NOT EXISTS "ceremony_templates" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"items" jsonb NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "ceremony_preps" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"items" jsonb NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);

-- Apply RLS policies on tables
ALTER TABLE public.ceremony_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceremony_preps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.ceremony_templates;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.ceremony_templates;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.ceremony_templates;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.ceremony_templates;

DROP POLICY IF EXISTS "Allow select for authenticated" ON public.ceremony_preps;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.ceremony_preps;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.ceremony_preps;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.ceremony_preps;

-- Create policies for authenticated
CREATE POLICY "Allow select for authenticated" ON public.ceremony_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated" ON public.ceremony_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON public.ceremony_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated" ON public.ceremony_templates FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow select for authenticated" ON public.ceremony_preps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated" ON public.ceremony_preps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated" ON public.ceremony_preps FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated" ON public.ceremony_preps FOR DELETE TO authenticated USING (true);

