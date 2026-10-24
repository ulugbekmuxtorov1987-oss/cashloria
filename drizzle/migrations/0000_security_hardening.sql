-- Media bucket settings must be applied through the Storage API, not storage schema SQL.
-- Requested settings: public=true, file_size_limit=4194304,
-- allowed_mime_types=['image/jpeg','image/png','image/webp'].
ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_path_length_check CHECK (char_length(path) <= 200),
  ADD CONSTRAINT analytics_events_visitor_id_length_check CHECK (char_length(visitor_id) <= 64),
  ADD CONSTRAINT analytics_events_lesson_slug_length_check CHECK (char_length(lesson_slug) <= 100);