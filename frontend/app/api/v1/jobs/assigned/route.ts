import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const backendUrl =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

const buildAuthHeaders = () => {
  const incoming = headers()
  const token = incoming.get('authorization') ?? ''

  return {
    Authorization: token,
    'Content-Type': 'application/json',
  }
}

export async function GET() {
  try {
    const response = await fetch(`${backendUrl}/api/v1/jobs/assigned`, {
      method: 'GET',
      headers: buildAuthHeaders(),
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : {}

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch assigned jobs' },
      { status: 500 }
    )
  }
}

