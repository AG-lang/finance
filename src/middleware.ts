import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // 创建响应对象
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 检查环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 如果环境变量不存在，跳过中间件逻辑
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase 环境变量未配置，跳过认证检查')
    // 如果访问的不是调试页，重定向到调试页
    if (!request.nextUrl.pathname.includes('/debug')) {
      return NextResponse.redirect(new URL('/auth/debug', request.url))
    }
    return response
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 如果用户未登录且访问的不是认证页面，重定向到登录页
    if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // 如果用户已登录且访问认证页面，重定向到首页
    if (user && request.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // 发生错误时，允许访问调试页面
    if (!request.nextUrl.pathname.includes('/debug')) {
      return NextResponse.redirect(new URL('/auth/debug', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public 文件夹
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}