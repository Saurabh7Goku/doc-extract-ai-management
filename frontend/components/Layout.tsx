'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

interface CurrentUser {
  email: string
  role: 'admin' | 'member'
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    setLoading(true)
    fetch('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('unauthorized')
        return res.json()
      })
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refreshUser()
    const handler = () => refreshUser()
    window.addEventListener('token-changed', handler)
    return () => window.removeEventListener('token-changed', handler)
  }, [refreshUser])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    window.dispatchEvent(new Event('token-changed'))
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            SaaS App
          </Link>
          {loading ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : user ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-700">
                Welcome, {user.email} ({user.role})
              </span>
              <Link
                href={user.role === 'admin' ? '/admin/dashboard' : '/member/working'}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Dashboard
              </Link>
              <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/login" className="bg-slate-900 text-white px-4 py-2 rounded">
                Admin Login
              </Link>
              <Link href="/member/working" className="bg-blue-500 text-white px-4 py-2 rounded">
                Member Working
              </Link>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4">{children}</main>
    </div>
  )
}