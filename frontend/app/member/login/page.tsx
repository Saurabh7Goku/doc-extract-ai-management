'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

export default function MemberLoginPage() {
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/v1/auth/verify-member-email', { email })
      setEmail(res.data.email)
      setIsNew(!res.data.exists)
      setStep('password')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Email is not allowed for member access'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isNew) {
        await api.post('/v1/auth/register-member', { email, password })
      }
      const res = await api.post(
        '/v1/auth/login',
        new URLSearchParams({ username: email, password }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      localStorage.setItem('token', res.data.access_token)
      if (res.data.role !== 'member') {
        localStorage.removeItem('token')
        toast.error('Please use the admin portal.')
        return
      }
      router.push('/member/working')
      toast.success('Signed in successfully')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Unable to sign in'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md space-y-6 bg-white p-6 rounded shadow">
        <h2 className="text-2xl mb-1">Member Login</h2>
        <p className="text-sm text-slate-500 mb-4">
          Use the email assigned by your admin to access your PDF extraction tasks.
        </p>

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Assigned email"
              className="w-full p-2 border rounded"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-sm text-slate-600">
              Verified email: <span className="font-semibold">{email}</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isNew ? 'Create password' : 'Enter password'}
              className="w-full p-2 border rounded"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
            >
              {loading ? 'Signing in...' : isNew ? 'Create password & continue' : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setPassword('')
              }}
              className="w-full text-sm text-slate-500 underline"
            >
              Use a different email
            </button>
          </form>
        )}

        <div className="text-center text-sm text-slate-600">
          Are you an admin?{' '}
          <Link href="/admin/login" className="text-blue-600 hover:text-blue-800 font-semibold">
            Go to Admin Login
          </Link>
        </div>
      </div>
    </div>
  )
}