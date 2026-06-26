-- Supabase Setup Script for YouFi & SME Manager
-- Run this in the SQL Editor of your Supabase Dashboard

-- 1. Create Users (Profiles) table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  name TEXT,
  currency TEXT DEFAULT 'USD',
  income DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data" 
  ON public.users FOR ALL 
  USING (auth.uid() = id);

-- 2. Create Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  note TEXT,
  type TEXT CHECK (type IN ('income', 'expense', 'debt')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own transactions" 
  ON public.transactions FOR ALL 
  USING (auth.uid() = user_id);

-- 3. Create Budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own budgets" 
  ON public.budgets FOR ALL 
  USING (auth.uid() = user_id);

-- 4. Create Savings Goals table
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount DECIMAL NOT NULL,
  saved_amount DECIMAL DEFAULT 0,
  deadline DATE,
  emoji TEXT DEFAULT '🎯',
  frequency TEXT DEFAULT 'monthly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own goals" 
  ON public.savings_goals FOR ALL 
  USING (auth.uid() = user_id);

-- 5. Create Financial Plans table
CREATE TABLE IF NOT EXISTS public.financial_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'proposed',
  progress DECIMAL DEFAULT 0,
  tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  plan_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own plans" 
  ON public.financial_plans FOR ALL 
  USING (auth.uid() = user_id);

-- 6. Create Trash table
CREATE TABLE IF NOT EXISTS public.trash (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  table_name TEXT NOT NULL,
  original_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.trash ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own trash" 
  ON public.trash FOR ALL 
  USING (auth.uid() = user_id);

-- 7. Create Businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  balance DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own businesses" 
  ON public.businesses FOR ALL 
  USING (auth.uid() = user_id);

-- 8. Create Business Transactions table
CREATE TABLE IF NOT EXISTS public.business_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  amount DECIMAL NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.business_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own business transactions" 
  ON public.business_transactions FOR ALL 
  USING (auth.uid() = user_id);

-- 9. Create Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  cost_price DECIMAL DEFAULT 0,
  selling_price DECIMAL,
  stock INTEGER DEFAULT 0,
  is_service BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own products" 
  ON public.products FOR ALL 
  USING (auth.uid() = user_id);

-- 10. Create Sales record table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  profit DECIMAL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own sales" 
  ON public.sales FOR ALL 
  USING (auth.uid() = user_id);

-- 11. Create Business Debts table
CREATE TABLE IF NOT EXISTS public.business_debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  lender TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.business_debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own business debts" 
  ON public.business_debts FOR ALL 
  USING (auth.uid() = user_id);

-- 12. Create Business Ideas table
CREATE TABLE IF NOT EXISTS public.business_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  plan JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.business_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own ideas" 
  ON public.business_ideas FOR ALL 
  USING (auth.uid() = user_id);

-- 13. Create Upcoming Payments table
CREATE TABLE IF NOT EXISTS public.upcoming_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  frequency TEXT,
  status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.upcoming_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own upcoming payments" 
  ON public.upcoming_payments FOR ALL 
  USING (auth.uid() = user_id);
