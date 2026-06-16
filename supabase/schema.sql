-- Run this SQL in your Supabase dashboard SQL editor

CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT DEFAULT '₹',
  category TEXT,
  avg_lead_time_days INTEGER DEFAULT 7,
  safety_stock_days INTEGER DEFAULT 14,
  ordering_cost DECIMAL DEFAULT 500,
  holding_cost_pct DECIMAL DEFAULT 0.25,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  name TEXT NOT NULL,
  sku TEXT,
  price DECIMAL,
  current_stock INTEGER,
  reorder_point INTEGER,
  sales_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  product_id UUID REFERENCES products(id),
  status TEXT,
  days_of_stock DECIMAL,
  daily_sales_avg DECIMAL,
  revenue_at_risk DECIMAL,
  reorder_qty INTEGER,
  ai_summary TEXT,
  action_tags JSONB,
  algorithm_output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
