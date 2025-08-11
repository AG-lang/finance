# Supabase + Next.js App Router 最佳实践指南

## 🔴 问题诊断：为什么登录后会被踢回登录页？

### 问题现象
用户成功登录后（Supabase 返回 200 OK），尝试跳转到受保护页面，但立即被重定向回登录页。

### 问题根源
这是 Next.js App Router 与 Supabase 集成时的**经典问题**。核心原因是：

1. **客户端登录成功** → Supabase 将 session 存储在 cookie 中
2. **页面跳转** → Next.js 尝试在服务端渲染新页面
3. **服务端检查认证** → 服务端组件无法正确读取客户端设置的 cookie
4. **认证失败** → 服务端认为用户未登录，重定向回登录页

### 网络请求分析
```
1. POST /auth/v1/token (200 OK) ✅ - 登录成功
2. GET /dashboard?_rsc=... (307) - 尝试跳转
3. GET /auth/login (200 OK) ❌ - 被踢回登录页
```

## ✅ 正确的解决方案：使用 @supabase/ssr

### 1. 安装依赖
```bash
pnpm add @supabase/ssr @supabase/supabase-js
```

### 2. 创建三个独立的 Supabase 客户端

#### 客户端组件 (`/utils/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 服务端组件 (`/utils/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 服务端组件无法设置 cookie
            // 中间件会处理这种情况
          }
        },
      },
    }
  )
}
```

#### 中间件 (`/middleware.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 关键：刷新 session
  const { data: { user } } = await supabase.auth.getUser()

  // 路由保护逻辑
  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 3. 在组件中使用

#### 客户端组件
```typescript
'use client'
import { createClient } from '@/utils/supabase/client'

export default function ClientComponent() {
  const supabase = createClient()
  
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
  }
}
```

#### 服务端组件
```typescript
import { createClient } from '@/utils/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // 用户已登录，继续渲染
}
```

## ❌ 常见错误做法

### 错误 1：使用单一的 Supabase 客户端
```typescript
// ❌ 错误：在所有地方使用同一个客户端
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(url, key)
```

### 错误 2：没有中间件刷新 session
```typescript
// ❌ 错误：中间件没有刷新 session
export async function middleware(request: NextRequest) {
  // 直接检查 cookie，没有通过 Supabase 刷新
  const token = request.cookies.get('sb-access-token')
  if (!token) {
    return NextResponse.redirect('/login')
  }
}
```

### 错误 3：在服务端组件中错误地创建客户端
```typescript
// ❌ 错误：服务端组件使用浏览器客户端
import { createBrowserClient } from '@supabase/ssr'

export default async function Page() {
  const supabase = createBrowserClient(...) // 这在服务端不工作！
}
```

## 🎯 关键要点

1. **必须使用 @supabase/ssr**
   - 不要使用原始的 @supabase/supabase-js
   - SSR 包专门处理了 cookie 管理问题

2. **三个客户端缺一不可**
   - 客户端组件用 `createBrowserClient`
   - 服务端组件用 `createServerClient` + cookies
   - 中间件负责刷新和同步 session

3. **中间件是核心**
   - 中间件在每个请求时刷新 session
   - 确保客户端和服务端的 session 同步
   - 处理 cookie 的读写操作

4. **环境变量命名**
   - 必须以 `NEXT_PUBLIC_` 开头
   - 否则客户端无法访问

## 🔍 调试技巧

### 1. 检查网络请求
在浏览器开发者工具的 Network 标签中查看：
- `/auth/v1/token` 应该返回 200 OK
- 后续请求应该携带正确的 cookie

### 2. 验证 cookie
在 Application → Cookies 中检查：
- `sb-access-token` 是否存在
- `sb-refresh-token` 是否存在

### 3. 使用调试页面
创建 `/auth/debug` 页面测试：
- Supabase 连接状态
- 用户登录状态
- Session 信息

### 4. 检查中间件日志
```typescript
export async function middleware(request: NextRequest) {
  console.log('Middleware - Path:', request.nextUrl.pathname)
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Middleware - User:', user?.email)
}
```

## 📚 参考资源

- [Supabase 官方文档：Next.js App Router](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 官方文档：中间件](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [@supabase/ssr 包文档](https://github.com/supabase/auth-helpers/tree/main/packages/ssr)

## 💡 最佳实践总结

1. **始终遵循官方指南** - Supabase 官方的 Next.js 集成指南是最权威的
2. **测试先行** - 在本地测试认证流程，确保正常后再部署
3. **使用 TypeScript** - 类型安全可以避免很多运行时错误
4. **错误处理** - 添加详细的错误日志便于调试
5. **环境隔离** - 开发和生产使用不同的 Supabase 项目

## ⚠️ 注意事项

- **不要在客户端暴露 service_role 密钥**
- **生产环境必须启用 RLS（行级安全）**
- **定期更新 @supabase/ssr 包**
- **确保 Vercel 和 Supabase 的 URL 配置正确**

---

记住：**登录后被踢回登录页 = SSR cookie 问题 = 需要 @supabase/ssr**

这个文档由实际踩坑经验总结而成，希望能帮助你避免同样的问题！