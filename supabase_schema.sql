-- Run this in your Supabase SQL Editor

-- 1. Create Journals table
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  note_content JSONB,
  tcm_content JSONB,
  gen_note_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Herbs table
CREATE TABLE herbs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  pinyin TEXT,
  scientific_name TEXT,
  category TEXT,
  description TEXT,
  nature_taste TEXT,
  functions TEXT,
  applications JSONB,
  herb_pairs JSONB,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Prescriptions table
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE,
  ingredients JSONB,
  analysis TEXT,
  indications JSONB,
  limitations JSONB,
  contraindications TEXT,
  usage_tips TEXT,
  location TEXT,
  notes TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Insert initial mock prescriptions data to verify
INSERT INTO prescriptions (name, date, ingredients, analysis, indications, limitations, contraindications, usage_tips, location, notes, type)
VALUES (
  '消风止痒颗粒',
  '2026-05-07',
  '["麻黄", "防风", "荆芥", "蝉蜕", "苦参"]',
  'Formulated to dispel wind, clear heat, eliminate dampness, and relieve itching. Often prescribed for urticaria, eczema, and skin pruritus presenting with wind-damp-heat patterns.',
  '["Acute urticaria (hives)", "Papular urticaria", "Eczema with severe itching"]',
  '["Avoid during pregnancy"]',
  'Not suitable for pregnant women. Use with caution in patients with severe chronic diseases like hypertension.',
  'Dissolve in warm water. Advise patient to avoid spicy, greasy, or seafood foods.',
  'Hangzhou, Zhejiang',
  'Patient reported significant reduction in pruritus within 48 hours.',
  'Granules'
);

-- Set up Row Level Security (RLS) to be fully open for development (WARNING: Secure this for production!)
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE herbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon on journals" ON journals FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on herbs" ON herbs FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon on prescriptions" ON prescriptions FOR ALL USING (true);
