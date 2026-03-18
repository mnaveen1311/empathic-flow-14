
-- Table to store uploaded CSV files metadata and data
CREATE TABLE public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sensing', 'survey', 'app_usage', 'education')),
  row_count INTEGER NOT NULL DEFAULT 0,
  file_size INTEGER NOT NULL DEFAULT 0,
  headers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table to store actual CSV row data
CREATE TABLE public.uploaded_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.uploaded_files(id) ON DELETE CASCADE NOT NULL,
  row_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table to store mood chat messages
CREATE TABLE public.mood_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  detected_mood TEXT,
  mood_score NUMERIC,
  behavior_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS since this is a public dashboard without auth
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_messages ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for this dashboard)
CREATE POLICY "Allow public read uploaded_files" ON public.uploaded_files FOR SELECT USING (true);
CREATE POLICY "Allow public insert uploaded_files" ON public.uploaded_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete uploaded_files" ON public.uploaded_files FOR DELETE USING (true);

CREATE POLICY "Allow public read uploaded_data" ON public.uploaded_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert uploaded_data" ON public.uploaded_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete uploaded_data" ON public.uploaded_data FOR DELETE USING (true);

CREATE POLICY "Allow public read mood_messages" ON public.mood_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert mood_messages" ON public.mood_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete mood_messages" ON public.mood_messages FOR DELETE USING (true);
