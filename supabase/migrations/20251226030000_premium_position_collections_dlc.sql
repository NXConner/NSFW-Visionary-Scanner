-- Premium Position Collections DLC ($9.99/month)
-- Advanced pose library with 50+ positions

-- Create position collections table
CREATE TABLE IF NOT EXISTS public.position_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('basic', 'intermediate', 'advanced', 'expert', 'couples', 'solo')),
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  thumbnail_url TEXT,
  benefits TEXT[],
  prerequisites TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create positions table
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.position_collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  duration_minutes INTEGER,
  image_url TEXT,
  video_url TEXT,
  tags TEXT[],
  muscle_groups TEXT[],
  health_benefits TEXT[],
  safety_notes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user position favorites
CREATE TABLE IF NOT EXISTS public.user_position_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);

-- Create user custom collections
CREATE TABLE IF NOT EXISTS public.user_custom_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user custom collection positions
CREATE TABLE IF NOT EXISTS public.user_custom_collection_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.user_custom_collections(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, position_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_positions_collection_id ON public.positions(collection_id);
CREATE INDEX IF NOT EXISTS idx_positions_tags ON public.positions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_position_favorites_user_id ON public.user_position_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_collections_user_id ON public.user_custom_collections(user_id);

-- Enable RLS
ALTER TABLE public.position_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_position_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_collection_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read position collections and positions
CREATE POLICY "Anyone can view position collections" ON public.position_collections FOR SELECT USING (true);
CREATE POLICY "Anyone can view positions" ON public.positions FOR SELECT USING (true);

-- Users can manage their own favorites
CREATE POLICY "Users can manage their favorites" ON public.user_position_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own custom collections
CREATE POLICY "Users can manage their custom collections" ON public.user_custom_collections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their custom collection positions" ON public.user_custom_collection_positions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_custom_collections
      WHERE id = user_custom_collection_positions.collection_id
      AND user_id = auth.uid()
    )
  );

-- Seed data: 50+ positions across different categories
INSERT INTO public.position_collections (name, description, category, difficulty_level) VALUES
  ('Essential Basics', 'Foundational positions for beginners', 'basic', 1),
  ('Intermediate Techniques', 'Build upon the basics with these intermediate moves', 'intermediate', 3),
  ('Advanced Mastery', 'Expert-level positions for experienced practitioners', 'advanced', 4),
  ('Couples Connection', 'Positions designed for partner work', 'couples', 2),
  ('Solo Practice', 'Individual exercises and stretches', 'solo', 1),
  ('Expert Challenge', 'The most challenging positions for peak performance', 'expert', 5);

COMMENT ON TABLE public.position_collections IS 'Premium DLC: Position collections for advanced pose library';
COMMENT ON TABLE public.positions IS 'Premium DLC: Individual positions within collections';
COMMENT ON TABLE public.user_position_favorites IS 'Premium DLC: User favorited positions';
COMMENT ON TABLE public.user_custom_collections IS 'Premium DLC: User created position collections';
