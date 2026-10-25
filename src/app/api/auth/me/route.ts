import { NextResponse } from "next/server"
import { getUserSession } from "@/lib/auth"

export async function GET() {
  const session = await getUserSession()
  if (!session) {
    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null
    })
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: session
  })
}
