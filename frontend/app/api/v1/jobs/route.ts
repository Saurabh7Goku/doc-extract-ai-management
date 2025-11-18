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

const forward = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${backendUrl}${path}`, init)
  const raw = await response.text()
  const data = raw ? JSON.parse(raw) : {}
  return { response, data }
}

export async function GET() {
  try {
    const { response, data } = await forward('/api/v1/jobs/', {
      headers: buildAuthHeaders(),
    })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()

    const { response, data } = await forward('/api/v1/jobs/', {
      method: 'POST',
      headers: buildAuthHeaders(),
      body,
    })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.text()

    const { response, data } = await forward('/api/v1/jobs/', {
      method: 'DELETE',
      headers: buildAuthHeaders(),
      body,
    })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete jobs' },
      { status: 500 }
    )
  }
}
