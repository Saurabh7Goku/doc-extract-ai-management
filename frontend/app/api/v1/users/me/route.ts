// frontend/app/api/v1/users/me/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const backendUrl =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

export async function GET() {
  const incomingHeaders = headers();
  const token = incomingHeaders.get('authorization') ?? '';

  try {
    const response = await fetch(`${backendUrl}/api/v1/users/me`, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    });

    const raw = await response.text();
    let data: unknown;

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { detail: raw };
    }

    return NextResponse.json(data ?? {}, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}