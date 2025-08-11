-- 启用 RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Users 表策略
-- 用户只能查看和更新自己的信息
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Categories 表策略
-- 用户可以查看公共分类和自己创建的分类
CREATE POLICY "View public and own categories" ON categories
  FOR SELECT USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- 用户只能创建属于自己的分类
CREATE POLICY "Users can create own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己创建的分类
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己创建的分类
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions 表策略
-- 用户只能查看自己的交易记录
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能创建属于自己的交易记录
CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的交易记录
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的交易记录
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets 表策略
-- 用户只能查看自己的预算
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能创建属于自己的预算
CREATE POLICY "Users can create own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的预算
CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的预算
CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- 创建一个函数，在用户注册时自动创建用户记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器，在 auth.users 表插入新记录时触发
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();