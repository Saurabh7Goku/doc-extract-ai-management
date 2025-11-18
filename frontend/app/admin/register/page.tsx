'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import React from 'react'
import { getApiUrl } from '../../../lib/utils'

export default function AdminRegister() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Register admin
            await axios.post(getApiUrl('v1/auth/register-admin'),
                { email, password }
            )

            // Auto login after registration
            const loginRes = await axios.post(
                getApiUrl('api/v1/auth/login'),
                new URLSearchParams({ username: email, password })
            )

            localStorage.setItem('token', loginRes.data.access_token)
            router.push('/admin/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Admin Registration</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        minLength={6}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Registering...' : 'Register as Admin'}
                </button>

                <div className="mt-4 text-center">
                    <a
                        href="/member/login"
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Already have an account? Login
                    </a>
                </div>
            </form>
        </div>
    )
}

