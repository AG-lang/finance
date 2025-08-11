'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Result {
  success: boolean
  message: string
  data?: unknown
  hint?: string
}

export default function DebugAuthPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('test123456')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // 测试 Supabase 连接
  const testConnection = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('users').select('count')
      setResult({ 
        success: !error, 
        message: error ? `连接失败: ${error.message}` : '连接成功',
        data 
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setResult({ success: false, message: `错误: ${errorMessage}` })
    }
    setLoading(false)
  }

  // 创建测试用户
  const createTestUser = async () => {
    setLoading(true)
    try {
      // 1. 先在 Auth 中创建用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: 'Test User'
          }
        }
      })

      if (authError) {
        setResult({ 
          success: false, 
          message: `创建Auth用户失败: ${authError.message}`,
          hint: '检查Supabase项目设置中的认证配置'
        })
        setLoading(false)
        return
      }

      // 2. 如果成功，检查是否需要邮箱验证
      if (authData.user && !authData.session) {
        setResult({ 
          success: true, 
          message: '用户创建成功！请检查邮箱进行验证。',
          data: authData,
          hint: '如需跳过邮箱验证，请在Supabase后台关闭邮箱验证功能'
        })
      } else if (authData.user && authData.session) {
        // 3. 自动登录成功，创建用户记录
        const { error: dbError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: authData.user.email,
            name: 'Test User'
          })

        if (dbError) {
          setResult({ 
            success: false, 
            message: `创建用户记录失败: ${dbError.message}`,
            hint: '检查users表的RLS策略'
          })
        } else {
          setResult({ 
            success: true, 
            message: '用户创建并登录成功！',
            data: authData
          })
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setResult({ success: false, message: `错误: ${errorMessage}` })
    }
    setLoading(false)
  }

  // 测试登录
  const testLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult({ 
          success: false, 
          message: `登录失败: ${error.message}`,
          hint: error.message.includes('Invalid login credentials') 
            ? '用户不存在或密码错误，请先创建用户'
            : '检查Supabase配置'
        })
      } else {
        setResult({ 
          success: true, 
          message: '登录成功！',
          data 
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setResult({ success: false, message: `错误: ${errorMessage}` })
    }
    setLoading(false)
  }

  // 获取当前用户
  const getCurrentUser = async () => {
    setLoading(true)
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setResult({ 
          success: false, 
          message: `获取用户失败: ${error.message}` 
        })
      } else if (!user) {
        setResult({ 
          success: false, 
          message: '没有登录用户' 
        })
      } else {
        setResult({ 
          success: true, 
          message: '当前用户信息',
          data: user 
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setResult({ success: false, message: `错误: ${errorMessage}` })
    }
    setLoading(false)
  }

  // 列出所有Auth用户（需要service_role密钥）
  const listAuthUsers = async () => {
    setLoading(true)
    try {
      // 注意：这个功能需要service_role密钥，通常不在客户端使用
      const { data: { users }, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        setResult({ 
          success: false, 
          message: `获取用户列表失败: ${error.message}`,
          hint: '此功能需要service_role密钥，通常只在服务端使用'
        })
      } else {
        setResult({ 
          success: true, 
          message: `共有 ${users?.length || 0} 个用户`,
          data: users 
        })
      }
    } catch {
      setResult({ 
        success: false, 
        message: '此功能需要管理员权限',
        hint: '请在Supabase后台查看用户列表'
      })
    }
    setLoading(false)
  }

  // 重置密码
  const resetPassword = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      
      if (error) {
        setResult({ 
          success: false, 
          message: `发送重置邮件失败: ${error.message}` 
        })
      } else {
        setResult({ 
          success: true, 
          message: '重置邮件已发送，请检查邮箱' 
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setResult({ success: false, message: `错误: ${errorMessage}` })
    }
    setLoading(false)
  }

  // 登出
  const testSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setResult({ 
          success: false, 
          message: `登出失败: ${error.message}` 
        })
      } else {
        setResult({ 
          success: true, 
          message: '已成功登出' 
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setResult({ success: false, message: `错误: ${errorMessage}` })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supabase 认证调试工具</CardTitle>
            <CardDescription>
              用于测试和调试 Supabase 认证系统
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 测试账号输入 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">邮箱</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">密码</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6个字符"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-3 gap-4">
              <Button onClick={testConnection} disabled={loading}>
                测试连接
              </Button>
              <Button onClick={createTestUser} disabled={loading} variant="outline">
                创建用户
              </Button>
              <Button onClick={testLogin} disabled={loading}>
                测试登录
              </Button>
              <Button onClick={getCurrentUser} disabled={loading} variant="outline">
                获取当前用户
              </Button>
              <Button onClick={listAuthUsers} disabled={loading} variant="outline">
                列出所有用户
              </Button>
              <Button onClick={resetPassword} disabled={loading} variant="outline">
                重置密码
              </Button>
              <Button onClick={testSignOut} disabled={loading} variant="destructive">
                登出
              </Button>
            </div>

            {/* 结果显示 */}
            {result && (
              <div className={`p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </div>
                {result.hint && (
                  <div className="mt-2 text-sm text-gray-600">
                    💡 提示: {result.hint}
                  </div>
                )}
                {result.data ? (
                  <pre className="mt-3 text-xs overflow-auto bg-white p-3 rounded">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                ) : null}
              </div>
            )}

            {/* 使用说明 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">使用步骤：</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>首先点击&quot;测试连接&quot;确认 Supabase 配置正确</li>
                <li>点击&quot;创建用户&quot;创建测试账号</li>
                <li>如果需要邮箱验证，检查邮箱并验证</li>
                <li>使用&quot;测试登录&quot;验证账号是否可用</li>
                <li>登录成功后可以访问主页面</li>
              </ol>
              
              <h3 className="font-medium text-blue-900 mt-4 mb-2">常见问题：</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Invalid login credentials</strong>: 用户不存在或密码错误</li>
                <li>• <strong>Email not confirmed</strong>: 需要验证邮箱</li>
                <li>• <strong>User already registered</strong>: 邮箱已被注册</li>
                <li>• <strong>连接失败</strong>: 检查环境变量配置</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}