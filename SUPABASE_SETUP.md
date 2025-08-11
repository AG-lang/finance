# Supabase 配置指南

## 快速开始

### 1. 创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com) 并创建账号
2. 创建新项目，记下项目 URL 和 Anon Key

### 2. 配置环境变量
创建 `.env.local` 文件：
```bash
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Anon密钥
```

### 3. 初始化数据库

在 Supabase 后台的 SQL Editor 中执行以下 SQL：

```sql
-- 1. 先执行这个创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 然后执行 supabase_schema.sql 中的其余内容
-- 3. 最后执行 supabase_rls.sql 设置权限
```

### 4. 配置认证设置

在 Supabase 后台：
1. 进入 Authentication > Providers
2. 确保 Email 认证已启用
3. （可选）关闭邮箱验证：Authentication > Settings > Email Auth > Confirm email 设为 false

### 5. 测试认证系统

1. 运行项目：`pnpm dev`
2. 访问调试页面：http://localhost:3001/auth/debug
3. 按以下步骤测试：
   - 点击"测试连接"确认配置正确
   - 点击"创建用户"创建测试账号
   - 点击"测试登录"验证登录功能

## 常见问题

### "Invalid login credentials" 错误
- **原因**：用户不存在或密码错误
- **解决**：先在调试页面创建用户，或使用注册页面创建账号

### "Missing Supabase environment variables" 错误
- **原因**：环境变量未配置
- **解决**：检查 `.env.local` 文件是否存在并包含正确的值

### 用户创建后无法在 users 表中看到记录
- **原因**：users 表的 ID 应该引用 auth.users
- **解决**：确保使用更新后的表结构，并在创建用户时同步创建 users 记录

### 邮箱验证问题
- **开发环境**：可以在 Supabase 后台关闭邮箱验证
- **生产环境**：建议保持邮箱验证开启

## 用户流程

1. **新用户注册**：
   - 访问 `/auth/register`
   - 填写信息注册
   - （如果开启了邮箱验证）检查邮箱并点击验证链接
   - 登录系统

2. **已有用户登录**：
   - 访问 `/auth/login`
   - 输入邮箱密码
   - 登录成功后跳转到主页

3. **忘记密码**：
   - 点击"忘记密码"
   - 输入邮箱
   - 检查邮箱并点击重置链接
   - 设置新密码

## 数据库触发器（可选）

如果希望在用户注册时自动创建 users 记录，可以创建触发器：

```sql
-- 创建函数：当新用户注册时自动创建用户记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

这样用户在 Auth 系统注册后会自动在 users 表中创建对应记录。