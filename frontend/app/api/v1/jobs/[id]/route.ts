import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

type Params = {
  params: { id: string }
}

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

export async function GET(_: Request, { params }: Params) {
  try {
    const response = await fetch(`${backendUrl}/api/v1/jobs/${params.id}`, {
      headers: buildAuthHeaders(),
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : {}

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load job' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.text()

    const response = await fetch(`${backendUrl}/api/v1/jobs/${params.id}`, {
      method: 'PUT',
      headers: buildAuthHeaders(),
      body,
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : {}

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const response = await fetch(`${backendUrl}/api/v1/jobs/${params.id}`, {
      method: 'DELETE',
      headers: buildAuthHeaders(),
    })

    return NextResponse.json({}, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
