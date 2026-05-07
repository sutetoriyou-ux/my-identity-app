-- ==============================
-- 自分まるごと投げ込みアプリ
-- Supabase DB定義
-- ==============================

-- カードカテゴリのenum
CREATE TYPE card_category AS ENUM (
  'skill',        -- スキルカード
  'personality',  -- 人物像カード
  'episode',      -- 素材カード
  'market',       -- 市場価値カード
  'value'         -- 価値観カード
);

-- 投げ込みテーブル（生データ）
CREATE TABLE inputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  input_type TEXT DEFAULT 'text' CHECK (input_type IN ('text', 'voice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- カードテーブル（AI仕分け済み）
CREATE TABLE cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category card_category NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  raw_input_id UUID REFERENCES inputs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 出力履歴テーブル
CREATE TABLE outputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scene TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（自分のデータのみ）
CREATE POLICY "inputs_own" ON inputs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cards_own" ON cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "outputs_own" ON outputs FOR ALL USING (auth.uid() = user_id);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
