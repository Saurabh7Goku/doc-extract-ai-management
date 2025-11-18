import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Layout from '../components/Layout'
import React from 'react'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'SaaS App',
    description: 'PDF Processing SaaS : Extract structured data from PDFs using AI',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Layout>{children}</Layout>
                <Toaster
                    position="bottom-right"
                    reverseOrder={false}
                    gutter={8}
                    containerClassName=""
                    toastOptions={{
                        duration: 5000,
                        style: {
                            background: '#fff',
                            color: '#363636',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            borderRadius: '12px',
                            padding: '16px',
                            maxWidth: '400px',
                        },
                        success: {
                            icon: 'Success',
                            style: { border: '1px solid #10b981' },
                        },
                        error: {
                            icon: 'Failed',
                            style: { border: '1px solid #ef4444' },
                        },
                        loading: {
                            icon: 'Processing',
                        },
                    }}
                />
            </body>
        </html>
    )
}