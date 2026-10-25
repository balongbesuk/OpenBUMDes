import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { comparePassword, createToken, AUTH_COOKIE_NAME } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username dan password wajib diisi." },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { username: username.trim().toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Username atau password salah." },
        { status: 401 }
      )
    }

    const isValid = comparePassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Username atau password salah." },
        { status: 401 }
      )
    }

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

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 // 7 hari
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
