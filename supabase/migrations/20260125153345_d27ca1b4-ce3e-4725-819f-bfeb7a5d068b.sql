-- Tracked resources table for storing monitored URLs/repos
CREATE TABLE public.tracked_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('github', 'website')),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Analytics snapshots for storing periodic data
CREATE TABLE public.analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.tracked_resources(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_tracked_resources_url ON public.tracked_resources(url);
CREATE INDEX idx_analytics_snapshots_resource_id ON public.analytics_snapshots(resource_id);
CREATE INDEX idx_analytics_snapshots_created_at ON public.analytics_snapshots(created_at DESC);

-- Enable RLS but allow public access since no auth
ALTER TABLE public.tracked_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required)
CREATE POLICY "Allow public read on tracked_resources" 
ON public.tracked_resources 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on tracked_resources" 
ON public.tracked_resources 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on tracked_resources" 
ON public.tracked_resources 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on tracked_resources" 
ON public.tracked_resources 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public read on analytics_snapshots" 
ON public.analytics_snapshots 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on analytics_snapshots" 
ON public.analytics_snapshots 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracked_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_snapshots;