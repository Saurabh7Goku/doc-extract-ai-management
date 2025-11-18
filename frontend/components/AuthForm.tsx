'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

interface Props {
    type: 'login' | 'register'
    onSuccess?: () => void
    expectedRole?: 'admin' | 'member'
    title?: string
    description?: string
}

export default function AuthForm({ type, onSuccess, expectedRole, title, description }: Props) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            let res
            if (type === 'login') {
                res = await api.post(
                    '/v1/auth/login',
                    new URLSearchParams({ username: email, password }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                )
            } else {
                await api.post('/v1/auth/register-member', { email, password })
                const loginRes = await api.post(
                    '/v1/auth/login',
                    new URLSearchParams({ username: email, password }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                )
                res = loginRes
            }
            localStorage.setItem('token', res.data.access_token)
            if (expectedRole && res.data.role !== expectedRole) {
                localStorage.removeItem('token')
                toast.error(`Please use the ${res.data.role === 'admin' ? 'admin' : 'member'} portal.`)
                return
            }
            if (onSuccess) onSuccess()
            router.push(res.data.role === 'admin' ? '/admin/dashboard' : '/member/working')
            toast.success('Signed in successfully')
        } catch (err) {
            console.error(err)
            toast.error('Invalid email or password')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-2xl mb-1">{title || (type === 'login' ? 'Login' : 'Set Password')}</h2>
            {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border mb-4" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border mb-4" required />
            <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white p-2 rounded">
                {loading ? 'Loading...' : type === 'login' ? 'Login' : 'Register'}
            </button>
        </form>
    )
}