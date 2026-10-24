-- roles
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- site settings (single row)
CREATE TABLE public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name text NOT NULL DEFAULT 'Cashloria',
  site_description text NOT NULL DEFAULT 'Learn money, one lesson a day.',
  author_name text NOT NULL DEFAULT 'Cashloria',
  contact_email text,
  instagram_url text,
  telegram_url text,
  extra_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_language text NOT NULL DEFAULT 'en',
  seo_title text,
  seo_description text,
  logo_url text,
  favicon_url text,
  avatar_url text,
  social_image_url text,
  ga_measurement_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.site_settings (id) VALUES (1);

-- levels
CREATE TABLE public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '📘',
  sort_order integer NOT NULL DEFAULT 0,
  locked boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.levels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.levels TO authenticated;
GRANT ALL ON public.levels TO service_role;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels public read" ON public.levels FOR SELECT TO anon, authenticated USING (published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "levels admin write" ON public.levels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER levels_touch BEFORE UPDATE ON public.levels FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- lessons
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '📘',
  category text NOT NULL DEFAULT 'money-basics',
  difficulty text NOT NULL DEFAULT 'beginner',
  minutes integer NOT NULL DEFAULT 5,
  xp integer NOT NULL DEFAULT 20,
  explanation jsonb NOT NULL DEFAULT '[]'::jsonb,
  example jsonb NOT NULL DEFAULT '{"title":"","body":""}'::jsonb,
  interactive jsonb,
  challenge jsonb NOT NULL DEFAULT '{"title":"","prompt":""}'::jsonb,
  recap jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons public read" ON public.lessons FOR SELECT TO anon, authenticated USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "lessons admin write" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER lessons_touch BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- quiz questions
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'choice' CHECK (kind IN ('choice','input')),
  type text NOT NULL DEFAULT 'multiple-choice',
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer text NOT NULL DEFAULT '',
  accepts jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation text NOT NULL DEFAULT '',
  xp integer NOT NULL DEFAULT 5,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.quiz_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz public read" ON public.quiz_questions FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND (l.status = 'published' OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "quiz admin write" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- sources
CREATE TABLE public.lesson_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  organization text,
  published_on date,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.lesson_sources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lesson_sources TO authenticated;
GRANT ALL ON public.lesson_sources TO service_role;
ALTER TABLE public.lesson_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources public read" ON public.lesson_sources FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND (l.status = 'published' OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "sources admin write" ON public.lesson_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- editable content blocks
CREATE TABLE public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_blocks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_blocks TO authenticated;
GRANT ALL ON public.content_blocks TO service_role;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content public read" ON public.content_blocks FOR SELECT TO anon, authenticated USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "content admin write" ON public.content_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER content_touch BEFORE UPDATE ON public.content_blocks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.content_blocks (key, label, title, body) VALUES
 ('home_hero','Homepage hero','Learn money the way you''d learn a language','Bite-sized lessons across five levels. Answer quizzes, earn XP, keep your streak alive and try real-world simulators.'),
 ('about','About section','About Cashloria','Cashloria is a free, independent financial education project built around short daily lessons.'),
 ('faq','FAQ','Frequently asked questions','Is Cashloria free? Yes. Is it financial advice? No — it is educational information only.'),
 ('footer','Footer text','Cashloria — learn money, one lesson a day',''),
 ('disclaimer','Disclaimer','Educational information only','Cashloria provides general educational information about personal finance. It is not personalized financial, investment, tax or legal advice.');

-- analytics
CREATE TABLE public.analytics_events (
  id bigserial PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('page_view','lesson_completed','quiz_attempt')),
  path text,
  lesson_slug text,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_created_idx ON public.analytics_events (created_at DESC);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can log events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- media storage access
CREATE POLICY "media public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY "media admin write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "media admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "media admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));