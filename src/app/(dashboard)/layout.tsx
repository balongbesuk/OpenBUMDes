import { cookies } from "next/headers"
import { getUserSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import DashboardLayoutClient from "./DashboardLayoutClient"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = await getUserSession()

  // Fallback to legacy cookie if token is not verified/present
  if (!user) {
    const cookieStore = await cookies()
    const legacyCookie = cookieStore.get("bumdes_user")?.value
    if (legacyCookie) {
      try {
        user = JSON.parse(decodeURIComponent(legacyCookie))
      } catch {}
    }
  }

  // If still no user, redirect to login
  if (!user) {
    redirect("/login")
  }

  // Fetch settings from DB
  const settingsList = await db.setting.findMany()
  const settings: Record<string, string> = {}
  settingsList.forEach((s) => {
    settings[s.key] = s.value
  })

  return (
    <DashboardLayoutClient user={user} initialSettings={settings}>
      {children}
    </DashboardLayoutClient>
  )
}
