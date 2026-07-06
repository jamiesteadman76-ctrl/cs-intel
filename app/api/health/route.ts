import { NextResponse } from 'next/server'

// Force dynamic so Vercel never serves a stale/prerendered response.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? 'local',
    region: process.env.VERCEL_REGION ?? null,
  })
}

export async function POST() {
  return new Response('Method Not Allowed', { status: 405 })
}
