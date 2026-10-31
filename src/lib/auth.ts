import crypto from "crypto"

const SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || (
  process.env.NODE_ENV === "production"
    ? (() => { throw new Error("AUTH_SECRET or JWT_SECRET must be configured in production") })()
    : "bumdes-kepmendes-136-secret-salt-2026"
)

export const AUTH_COOKIE_NAME = "bumdes_auth_token"

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function comparePassword(password: string, stored: string): boolean {
  try {
    if (!stored) return false
    // Dukungan hash bcrypt (diawali $2a$ atau $2b$) untuk akun hasil seeding
    if (stored.startsWith("$2")) {
      const bcrypt = require("bcryptjs")
      return bcrypt.compareSync(password, stored)
    }
    if (!stored.includes(":")) return false
    const [salt, hash] = stored.split(":")
    const check = crypto.scryptSync(password, salt, 64).toString("hex")
    return crypto.timingSafeEqual(Buffer.from(check, "hex"), Buffer.from(hash, "hex"))
  } catch {
    return false
  }
}

export function createToken(payload: { id: string; username: string; name: string; role: string; passwordHash?: string }): string {
  const pwdSig = payload.passwordHash ? payload.passwordHash.slice(0, 16) : undefined
  const data = JSON.stringify({
    ...payload,
    passwordHash: undefined,
    ...(pwdSig ? { pwdSig } : {}),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  })
  const b64 = Buffer.from(data).toString("base64url")
  const sig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url")
  return `${b64}.${sig}`
}

export function verifyToken(token: string): { id: string; username: string; name: string; role: string; pwdSig?: string } | null {
  try {
    if (!token || !token.includes(".")) return null
    const [b64, sig] = token.split(".")
    const expectedSig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url")
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null

    const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"))
    if (data.exp && Date.now() > data.exp) return null

    return {
      id: data.id,
      username: data.username,
      name: data.name,
      role: data.role,
      pwdSig: data.pwdSig
    }
  } catch {
    return null
  }
}

export async function getUserSession() {
  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)
    if (!token) return null
    const payload = verifyToken(token.value)
    if (!payload?.id) return null

    const { db } = await import("./db")
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true, name: true, role: true, passwordHash: true }
    })
    if (!user) return null
    if (payload.pwdSig && user.passwordHash.slice(0, 16) !== payload.pwdSig) {
      return null // Token revoked because user changed their password
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  } catch {
    return null
  }
}
