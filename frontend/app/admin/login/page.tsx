'use client'

import Link from 'next/link'
import AuthForm from '@/components/AuthForm'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <AuthForm
          type="login"
          expectedRole="admin"
          title="Admin Login"
          description="Sign in with your admin credentials to manage jobs, members, and PDF tasks."
        />
        <div className="text-center text-sm text-slate-600">
          Need an account?{' '}
          <Link href="/admin/register" className="text-blue-600 hover:text-blue-800 font-semibold">
            Register as Admin
          </Link>
        </div>
      </div>
    </div>
  )
}
