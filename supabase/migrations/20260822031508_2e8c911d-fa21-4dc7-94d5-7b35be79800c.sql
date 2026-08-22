CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  lessons jsonb NOT NULL DEFAULT '{}'::jsonb,
  challenges jsonb NOT NULL DEFAULT '[]'::jsonb,
  achievements jsonb NOT NULL DEFAULT '[]'::jsonb,
  favorites jsonb NOT NULL DEFAULT '[]'::jsonb,
  streak jsonb NOT NULL DEFAULT '{"count":0,"best":0,"lastDay":null}'::jsonb,
  country text NOT NULL DEFAULT 'US',
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own progress read" ON public.user_progress;
CREATE POLICY "own progress read" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own progress insert" ON public.user_progress;
CREATE POLICY "own progress insert" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own progress update" ON public.user_progress;
CREATE POLICY "own progress update" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own progress delete" ON public.user_progress;
CREATE POLICY "own progress delete" ON public.user_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_progress_touch ON public.user_progress;
CREATE TRIGGER user_progress_touch BEFORE UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';