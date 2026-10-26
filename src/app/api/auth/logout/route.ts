import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/auth"

export async function POST(request: Request) {
  const response = NextResponse.json({
    success: true,
    message: "Berhasil keluar dari sistem."
  })

  const isHttps =
    process.env.COOKIE_SECURE === "true" ||
    request.headers.get("x-forwarded-proto") === "https" ||
    request.url.startsWith("https:")

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  })

  return response
}
