import { cookies } from "next/headers"
import { getUserSession } from "@/lib/auth"
import { getDashboardStats } from "@/lib/dashboard-stats"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  let userName = "Admin"
  const user = await getUserSession()

  if (user && user.name) {
    userName = user.name
  } else {
    const cookieStore = await cookies()
    const legacyCookie = cookieStore.get("bumdes_user")?.value
    if (legacyCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(legacyCookie))
        userName = parsed.name || "Admin"
      } catch {}
    }
  }

  const stats = await getDashboardStats()

  return <DashboardClient stats={stats} initialUserName={userName} />
}
