# Vercel 部署配置指南

## 重要：在 Vercel 上配置环境变量

登录后的问题通常是因为 **环境变量未配置**。

### 1. 在 Vercel Dashboard 配置环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

⚠️ **注意**：这两个变量都必须以 `NEXT_PUBLIC_` 开头，否则客户端无法访问！

### 2. 在 Supabase 配置允许的重定向 URL

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Authentication** → **URL Configuration**
4. 在 **Site URL** 添加你的 Vercel 部署地址：
   ```
   https://你的项目.vercel.app
   ```
5. 在 **Redirect URLs** 添加：
   ```
   https://你的项目.vercel.app/**
   http://localhost:3001/**
   ```

### 3. 检查 CORS 设置

在 Supabase Dashboard：
1. 进入 **Settings** → **API**
2. 确保 CORS 设置包含你的 Vercel 域名

### 4. 重新部署

配置完环境变量后：
1. 在 Vercel Dashboard 点击 **Deployments**
2. 点击最新部署旁的三个点
3. 选择 **Redeploy**
4. 确认重新部署

## 调试步骤

如果还是无法登录：

### 1. 检查浏览器控制台
- 按 F12 打开开发者工具
- 查看 Console 标签页的错误信息
- 查看 Network 标签页的请求状态

### 2. 常见错误和解决方案

#### "Missing Supabase environment variables"
- **原因**：环境变量未设置
- **解决**：在 Vercel 添加环境变量并重新部署

#### "Invalid login credentials"
- **原因**：用户不存在
- **解决**：需要在生产环境创建用户

#### CORS 错误
- **原因**：Supabase 未配置允许 Vercel 域名
- **解决**：在 Supabase 添加 Vercel 域名到允许列表

#### "Unable to connect to Supabase"
- **原因**：环境变量值错误
- **解决**：检查 URL 和 Key 是否正确复制

### 3. 验证环境变量

可以在代码中临时添加日志来验证（记得删除）：

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

## 生产环境用户创建

由于生产环境是独立的，你需要：

1. 在生产环境重新注册用户
2. 或者使用 Supabase Dashboard 直接创建用户：
   - 进入 **Authentication** → **Users**
   - 点击 **Invite User** 或 **Create User**

## 检查清单

- [ ] Vercel 环境变量已配置
- [ ] 变量名以 `NEXT_PUBLIC_` 开头
- [ ] Supabase Site URL 已配置
- [ ] Supabase Redirect URLs 已配置
- [ ] 已重新部署 Vercel 项目
- [ ] 生产环境已有用户账号

## 需要帮助？

1. 查看 Vercel 函数日志：
   - Vercel Dashboard → Functions → 查看日志

2. 查看浏览器控制台错误信息

3. 访问 `/auth/debug` 页面测试连接（如果部署了调试页面）