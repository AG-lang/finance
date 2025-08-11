# 个人财务管理系统

一个基于 Next.js 15 + Supabase 的全栈个人记账应用。

## 🚀 技术栈

- **框架**: Next.js 15.4.6 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth + @supabase/ssr
- **样式**: Tailwind CSS
- **UI组件**: Radix UI + shadcn/ui
- **表单**: React Hook Form + Zod
- **状态管理**: Zustand
- **部署**: Vercel

## 📋 功能特性

- 🔐 用户认证（注册/登录/密码重置）
- 💰 收支记录管理
- 📊 数据统计和可视化
- 🏷️ 自定义分类管理
- 💹 预算设置和追踪
- 📤 数据导出（Excel/CSV）
- 📱 响应式设计

## 🛠️ 本地开发

### 前置要求

- Node.js 18+
- pnpm 包管理器
- Supabase 账号

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/finance.git
   cd finance
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   
   创建 `.env.local` 文件：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
   ```

4. **初始化数据库**
   
   在 Supabase SQL Editor 中执行：
   - `supabase_schema.sql` - 创建表结构
   - `supabase_rls.sql` - 设置行级安全策略

5. **启动开发服务器**
   ```bash
   pnpm dev
   ```
   
   访问 http://localhost:3001

## 🚨 重要提示：Supabase + Next.js SSR 集成

### ⚠️ 常见问题：登录后被重定向回登录页

这是使用 Next.js App Router + Supabase 时最常见的问题。原因是服务端组件无法正确读取客户端设置的 cookie。

### ✅ 正确的实现方式

**必须使用 `@supabase/ssr` 包，并为不同环境创建独立的客户端：**

1. **客户端组件** (`/utils/supabase/client.ts`)
2. **服务端组件** (`/utils/supabase/server.ts`)  
3. **中间件** (`/middleware.ts`) - 负责刷新 session

详细说明请查看：[SUPABASE_NEXTJS_BEST_PRACTICES.md](./SUPABASE_NEXTJS_BEST_PRACTICES.md)

## 📦 项目结构

```
finance/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── auth/               # 认证相关页面
│   │   │   ├── login/          # 登录
│   │   │   ├── register/       # 注册
│   │   │   ├── reset-password/ # 密码重置
│   │   │   └── debug/          # 调试工具
│   │   └── page.tsx            # 主页面
│   ├── components/             # React 组件
│   ├── contexts/               # React Context
│   ├── lib/                    # 工具库
│   ├── stores/                 # Zustand 状态管理
│   ├── types/                  # TypeScript 类型定义
│   ├── utils/                  # 工具函数
│   │   └── supabase/           # Supabase 客户端配置
│   └── middleware.ts           # Next.js 中间件
├── public/                     # 静态资源
└── supabase/                   # 数据库脚本

```

## 🔧 常用命令

```bash
# 开发
pnpm dev          # 启动开发服务器 (端口 3001)

# 构建
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器

# 代码质量
pnpm lint         # ESLint 检查
pnpm type-check   # TypeScript 类型检查
```

## 🚀 部署到 Vercel

### 1. 环境变量配置

在 Vercel Dashboard 中添加：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Supabase 配置

在 Supabase Dashboard 中：
- **Authentication > URL Configuration**
  - Site URL: `https://你的项目.vercel.app`
  - Redirect URLs: `https://你的项目.vercel.app/**`

### 3. 部署

```bash
git push origin main
```

Vercel 会自动触发部署。

## 🐛 调试工具

访问 `/auth/debug` 页面可以：
- 测试 Supabase 连接
- 创建测试用户
- 验证认证流程
- 查看详细错误信息

## 📝 开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 规则
- 使用 pnpm 作为包管理器
- 提交前运行 `pnpm build` 确保构建成功

## 🔒 安全提示

- 永远不要提交 `.env.local` 文件
- 定期更新依赖包
- 在生产环境启用 Supabase RLS（行级安全）
- 使用环境变量管理敏感信息

## 📚 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [项目部署指南](./VERCEL_DEPLOYMENT.md)
- [Supabase 配置指南](./SUPABASE_SETUP.md)
- [Next.js + Supabase 最佳实践](./SUPABASE_NEXTJS_BEST_PRACTICES.md)

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

⚡ 使用 [Claude Code](https://claude.ai/code) 辅助开发