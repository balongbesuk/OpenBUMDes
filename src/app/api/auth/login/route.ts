import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { comparePassword, createToken, AUTH_COOKIE_NAME } from "@/lib/auth"

// In-memory rate limiter per IP / username: max 5 failed attempts in 5 minutes
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>()

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
    const body = await request.json()
    const { username, password, rememberMe = true } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username dan password wajib diisi." },
        { status: 400 }
      )
    }

    const cleanUsername = username.trim().toLowerCase()
    const rateLimitKey = `${ip}:${cleanUsername}`
    const now = Date.now()
    const attemptRecord = failedAttempts.get(rateLimitKey)

    // Check if locked out
    if (attemptRecord && attemptRecord.lockedUntil > now) {
      const waitSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan masuk yang gagal. Silakan tunggu ${waitSeconds} detik sebelum mencoba kembali.`
        },
        { status: 429 }
      )
    }

    const user = await db.user.findUnique({
      where: { username: cleanUsername }
    })

    const recordFailedAttempt = async () => {
      // Artificial delay (300ms) to mitigate rapid automated attacks
      await new Promise((resolve) => setTimeout(resolve, 300))
      const current = failedAttempts.get(rateLimitKey) || { count: 0, lockedUntil: 0 }
      current.count += 1
      if (current.count >= 5) {
        current.lockedUntil = Date.now() + 60 * 1000 // Lock for 60 seconds
      }
      failedAttempts.set(rateLimitKey, current)
      if (failedAttempts.size > 200) {
        const threshold = Date.now()
        for (const [k, v] of failedAttempts.entries()) {
          if (v.lockedUntil < threshold) failedAttempts.delete(k)
        }
      }
    }

    if (!user) {
      await recordFailedAttempt()
      return NextResponse.json(
        { success: false, error: "Username atau password salah." },
        { status: 401 }
      )
    }

    const isValid = comparePassword(password, user.passwordHash)
    if (!isValid) {
      await recordFailedAttempt()
      return NextResponse.json(
        { success: false, error: "Username atau password salah." },
        { status: 401 }
      )
    }

    // Login successful: reset failed attempt counter
    failedAttempts.delete(rateLimitKey)

    const token = createToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    })

    const response = NextResponse.json({
      success: true,
      message: `Selamat datang, ${user.name}!`,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })

    const isHttps =
      process.env.COOKIE_SECURE === "true" ||
      request.headers.get("x-forwarded-proto") === "https" ||
      request.url.startsWith("https:")

    // 7 hari jika Ingat Sesi Masuk dicentang, 1 hari jika tidak dicentang
    const cookieMaxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAge
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
