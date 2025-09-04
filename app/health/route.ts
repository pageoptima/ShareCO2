import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { 
      status: 'Service is running healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
      }
    }
  )
}