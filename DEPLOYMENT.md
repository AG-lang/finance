# 快速部署指南

## 🚀 一键部署到 Vercel

### 步骤概览
1. 准备 Supabase 数据库
2. 部署到 Vercel
3. 配置环境变量
4. 测试应用

---

## 📋 详细步骤

### 1. 创建并配置 Supabase 数据库

#### 1.1 创建 Supabase 项目
- 访问 [supabase.com](https://supabase.com)
- 点击 "Start your project"
- 创建新项目并等待初始化完成
- 记录以下信息：
  - **Project URL**: `https://xxx.supabase.co`
  - **Anon Key**: `eyJhbGciOiJIUzI1NiIs...`

#### 1.2 初始化数据库表
1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 复制 `supabase_schema.sql` 文件的全部内容
3. 粘贴到 SQL Editor 中并点击 **Run**
4. 确认所有表和默认分类已创建成功

### 2. 部署到 Vercel

#### 方法 A: 通过 GitHub（推荐）
1. 将代码推送到 GitHub 仓库
2. 访问 [vercel.com/dashboard](https://vercel.com/dashboard)
3. 点击 **"New Project"**
4. 选择你的 GitHub 仓库
5. 点击 **"Deploy"**

#### 方法 B: 使用 Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 3. 配置环境变量

在 Vercel Dashboard 的项目设置中添加环境变量：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase Anon Key |

3. 点击 **Save** 保存
4. 触发重新部署（Deployments → 点击最新部署 → Redeploy）

### 4. 测试应用

- 访问 Vercel 提供的应用 URL
- 测试添加收支记录功能
- 检查分类管理是否正常
- 验证数据统计图表显示

---

## 🔧 故障排除

### 常见问题

**Q: 部署成功但页面显示错误？**
- 检查环境变量是否正确配置
- 确认 Supabase URL 和 Key 无误
- 查看 Vercel 部署日志中的错误信息

**Q: 数据库连接失败？**
- 确认 Supabase 项目状态正常
- 检查数据库表是否正确创建
- 验证 RLS（行级安全）政策设置

**Q: 添加数据时报错？**
- 确认数据库 schema 正确执行
- 检查默认分类是否已创建
- 验证用户权限设置

### 获取帮助

如遇到问题，可以：
1. 查看 [Vercel 部署文档](https://vercel.com/docs)
2. 参考 [Supabase 文档](https://supabase.com/docs)
3. 在项目 Issues 中报告问题

---

## 🎉 完成！

恭喜！你的个人记账应用现在已经成功部署到 Vercel。

**下一步建议：**
- 为应用设置自定义域名
- 配置定期数据备份
- 根据需要添加更多功能