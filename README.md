# 个人记账应用

一个简洁优雅的个人财务管理工具，基于 Next.js 14 构建，使用 Supabase 作为后端服务，部署在 Vercel 平台。

## ✨ 功能特性

### 核心功能
- 📝 **收支记录** - 快速添加、编辑和删除收入支出记录
- 📂 **分类管理** - 自定义收支分类，灵活管理账目类别
- 📊 **数据统计** - 直观的图表展示收支趋势和分类占比
- 💰 **预算管理** - 设置月度预算，实时监控支出情况
- 📥 **数据导出** - 支持导出 Excel 和 CSV 格式数据

### 技术特点
- 🚀 基于 Next.js 14 App Router，性能优越
- 💅 使用 Tailwind CSS 实现响应式设计
- 🔒 Supabase 提供安全的数据存储
- 📈 Recharts 实现丰富的数据可视化
- 🎯 TypeScript 提供类型安全保障

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **UI库**: Tailwind CSS + 自定义组件
- **状态管理**: Zustand
- **数据库**: Supabase (PostgreSQL)
- **图表**: Recharts
- **表单**: React Hook Form + Zod
- **日期处理**: date-fns
- **部署**: Vercel

## 📦 安装指南

### 前置要求
- Node.js 18.0 或更高版本
- pnpm 包管理器
- Supabase 账号

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/finance-app.git
cd finance-app
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 配置环境变量
创建 `.env.local` 文件并添加以下内容：
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. 配置 Supabase 数据库

#### 4.1 创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 记录项目的 URL 和 Anon Key

#### 4.2 初始化数据库
在 Supabase Dashboard 的 SQL Editor 中执行 `supabase_schema.sql` 文件中的 SQL 语句：

```sql
-- 创建表结构和索引
-- 详见 supabase_schema.sql 文件
```

### 5. 启动开发服务器
```bash
pnpm dev
```
访问 [http://localhost:3000](http://localhost:3000) 查看应用

## 🚀 部署到 Vercel

### 方法一：通过 Vercel CLI

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 登录 Vercel
```bash
vercel login
```

3. 部署项目
```bash
vercel
```

4. 设置环境变量
在 Vercel Dashboard 中添加以下环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 方法二：通过 GitHub 集成

1. 将代码推送到 GitHub
```bash
git add .
git commit -m "初始提交"
git push origin main
```

2. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
3. 点击 "New Project"
4. 导入 GitHub 仓库
5. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. 点击 "Deploy"

### 方法三：一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/finance-app&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=需要配置Supabase的URL和密钥)

## 📋 项目结构

```
finance/
├── src/
│   ├── app/                  # Next.js App Router 页面
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 主页面
│   ├── components/           # React 组件
│   │   ├── ui/              # 基础 UI 组件
│   │   ├── TransactionForm.tsx    # 交易表单
│   │   ├── TransactionList.tsx    # 交易列表
│   │   ├── CategoryManager.tsx    # 分类管理
│   │   ├── BudgetManager.tsx      # 预算管理
│   │   ├── Statistics.tsx         # 统计图表
│   │   └── ExportData.tsx         # 数据导出
│   ├── lib/                  # 工具函数和配置
│   │   ├── supabase.ts      # Supabase 客户端
│   │   └── utils.ts          # 通用工具函数
│   ├── stores/               # 状态管理
│   │   └── useStore.ts       # Zustand store
│   └── types/                # TypeScript 类型定义
│       └── index.ts          # 类型定义文件
├── public/                   # 静态资源
├── .env.local               # 环境变量（不提交到 Git）
├── supabase_schema.sql      # 数据库初始化脚本
├── package.json             # 项目依赖
└── README.md                # 项目文档
```

## 🔧 常用命令

```bash
# 开发
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器

# 代码质量
pnpm lint         # ESLint 检查
pnpm type-check   # TypeScript 类型检查

# 部署
vercel            # 部署到 Vercel
vercel --prod     # 部署到生产环境
```

## 🎯 功能使用说明

### 添加交易记录
1. 点击页面右上角的"记一笔"按钮
2. 选择收入或支出类型
3. 输入金额和选择分类
4. 可选填写备注信息
5. 选择日期
6. 点击保存

### 管理分类
1. 切换到"分类管理"标签
2. 点击"添加分类"创建新分类
3. 点击编辑图标修改分类名称
4. 点击删除图标移除分类

### 设置预算
1. 切换到"预算管理"标签
2. 点击"添加预算"
3. 选择分类和设置预算金额
4. 系统会自动跟踪该分类的支出情况
5. 超支时会显示警告

### 查看统计
1. 切换到"数据统计"标签
2. 查看月度收支趋势图
3. 查看分类占比饼图
4. 查看结余趋势线图

### 导出数据
1. 切换到"数据导出"标签
2. 选择日期范围
3. 选择导出类型（全部/收入/支出）
4. 选择导出格式（Excel/CSV）
5. 点击导出按钮

## 🔐 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIs...` |

## 📱 响应式设计

应用已完全适配移动端、平板和桌面设备：
- **移动端** (< 768px): 单列布局，触摸优化
- **平板** (768px - 1024px): 双列布局，平衡展示
- **桌面** (> 1024px): 多列布局，完整功能展示

## 🚨 注意事项

1. **数据安全**: 请妥善保管 Supabase 密钥，不要提交到公开仓库
2. **浏览器兼容**: 支持所有现代浏览器，IE 不支持
3. **数据备份**: 建议定期导出数据进行备份
4. **隐私保护**: 本应用不收集任何个人隐私信息

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m '添加某个功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 开源协议

本项目基于 MIT 协议开源

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端服务
- [Vercel](https://vercel.com/) - 部署平台
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Recharts](https://recharts.org/) - 图表库

---

⭐ 如果这个项目对你有帮助，请给一个 Star！