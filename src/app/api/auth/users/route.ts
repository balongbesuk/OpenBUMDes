import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession, hashPassword } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak. Silakan login." }, { status: 401 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { role: "asc" }
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Hanya Admin yang memiliki wewenang mengelola pengguna." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, username, password, name, role = "OPERATOR" } = body

    if (!username || !name) {
      return NextResponse.json(
        { success: false, error: "Username dan nama lengkap wajib diisi." },
        { status: 400 }
      )
    }

    const cleanUsername = username.trim().toLowerCase()

    if (id) {
      // Edit User
      const newRole = role.toUpperCase()
      const existingUser = await db.user.findUnique({ where: { id } })
      if (existingUser?.role === "ADMIN" && newRole !== "ADMIN") {
        const adminCount = await db.user.count({ where: { role: "ADMIN" } })
        if (adminCount <= 1) {
          return NextResponse.json(
            { success: false, error: "Tidak dapat mengubah peran satu-satunya Administrator sistem." },
            { status: 400 }
          )
        }
      }

      const updateData: any = {
        name,
        role: newRole
      }
      if (password && password.trim().length > 0) {
        updateData.passwordHash = hashPassword(password)
      }

      const updated = await db.user.update({
        where: { id },
        data: updateData,
        select: { id: true, username: true, name: true, role: true }
      })

      return NextResponse.json({ success: true, message: `Data pengguna ${updated.name} berhasil diperbarui.`, data: updated })
    } else {
      // Create User
      if (!password || password.trim().length < 4) {
        return NextResponse.json(
          { success: false, error: "Password minimal 4 karakter." },
          { status: 400 }
        )
      }

      const exists = await db.user.findUnique({
        where: { username: cleanUsername }
      })
      if (exists) {
        return NextResponse.json(
          { success: false, error: `Username "${cleanUsername}" sudah digunakan.` },
          { status: 400 }
        )
      }

      const created = await db.user.create({
        data: {
          username: cleanUsername,
          passwordHash: hashPassword(password),
          name,
          role: role.toUpperCase()
        },
        select: { id: true, username: true, name: true, role: true }
      })

      return NextResponse.json({ success: true, message: `Pengguna ${created.name} berhasil ditambahkan.`, data: created })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Hanya Administrator yang memiliki wewenang menghapus akun pengguna." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    let id = searchParams.get("id")

    if (!id) {
      try {
        const body = await request.json()
        id = body?.id
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "ID pengguna wajib disertakan." }, { status: 400 })
    }

    if (id === session.id) {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif masuk." },
        { status: 400 }
      )
    }

    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Akun pengguna tidak ditemukan." }, { status: 404 })
    }

    if (targetUser.role === "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } })
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Tidak dapat menghapus satu-satunya akun Administrator sistem." },
          { status: 400 }
        )
      }
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: `Akun ${targetUser.role === "ADMIN" ? "Administrator" : "Operator"} "${targetUser.name}" (@${targetUser.username}) berhasil dihapus.`
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
