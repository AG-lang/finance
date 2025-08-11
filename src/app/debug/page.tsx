'use client'

import { useEffect } from 'react'

export default function DebugPage() {
  useEffect(() => {
    console.log('Environment variables check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set')
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">环境变量调试</h1>
      <div className="space-y-2">
        <p>
          <strong>Supabase URL:</strong>{' '}
          {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ 未设置'}
        </p>
        <p>
          <strong>Supabase Key:</strong>{' '}
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置'}
        </p>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h2 className="font-bold">检查步骤：</h2>
        <ol className="list-decimal list-inside mt-2">
          <li>在 Vercel Dashboard 中检查环境变量</li>
          <li>确保变量名完全匹配（包括 NEXT_PUBLIC_ 前缀）</li>
          <li>保存后重新部署</li>
        </ol>
      </div>
    </div>
  )
}