import { NextResponse } from 'next/server'

const backendUrl =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') ?? 'application/x-www-form-urlencoded',
      },
      body,
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : {}

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { detail: 'Unable to login at the moment. Please try again.' },
      { status: 500 }
    )
  }
}
