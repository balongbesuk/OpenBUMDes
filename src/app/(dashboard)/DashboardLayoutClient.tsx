"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { SettingsProvider } from "@/context/SettingsContext"
import {
  LayoutDashboard,
  Coins,
  Building2,
  Map,
  CreditCard,
  Mail,
  Newspaper,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  CalendarDays
} from "lucide-react"

interface User {
  id: string
  username: string
  name: string
  role: string
}

interface DashboardLayoutClientProps {
  children: React.ReactNode
  user: User
  initialSettings: any
}

// Define navigation items based on user roles
const allNavItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "BENDAHARA", "SEKRETARIS", "OPERATOR_SP", "OPERATOR_SEWA"]
  },
  {
    name: "Pembukuan & Laporan (PPAK)",
    href: "/keuangan",
    icon: BookOpen,
    roles: ["ADMIN", "BENDAHARA", "OPERATOR_SP", "OPERATOR_SEWA"]
  },
  {
    name: "Persuratan",
    href: "/persuratan",
    icon: Mail,
    roles: ["ADMIN", "SEKRETARIS"]
  },
  {
    name: "Artikel & Berita",
    href: "/artikel",
    icon: Newspaper,
    roles: ["ADMIN", "SEKRETARIS"]
  },
  {
    name: "Pengaturan Sistem",
    href: "/pengaturan",
    icon: Settings,
    roles: ["ADMIN", "BENDAHARA"]
  }
]

export default function DashboardLayoutClient({
  children,
  user,
  initialSettings,
}: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Enforce role authorization check on client-side as backup
  useEffect(() => {
    if (pathname !== "/dashboard") {
      const sortedItems = [...allNavItems].sort((a, b) => b.href.length - a.href.length)
      const matchedItem = sortedItems.find(
        (item) => item.href !== "/dashboard" && (pathname === item.href || pathname.startsWith(item.href + "/"))
      )
      
      if (matchedItem && !matchedItem.roles.includes(user.role)) {
        router.push("/dashboard")
      }
    }
  }, [pathname, user.role, router])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    localStorage.removeItem("bumdes_user")
    router.push("/login")
  }

  const navItems = allNavItems
    .filter((item) => item.roles.includes(user.role))
    .filter((item) => {
      if (item.name === "Persuratan") return initialSettings?.module_persuratan !== "false"
      return true
    })

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Kepala BUMDES"
      case "BENDAHARA":
        return "Bendahara"
      case "SEKRETARIS":
        return "Sekretaris"
      case "OPERATOR_SP":
        return "Staf Simpan Pinjam"
      case "OPERATOR_SEWA":
        return "Staf Sewa"
      default:
        return "Staf BUMDES"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "BENDAHARA":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "SEKRETARIS":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      <style dangerouslySetInnerHTML={{ __html: `
        .print-only {
          display: none !important;
        }
        @media print {
          /* Hide sidebar, headers and other layout elements with high specificity */
          body aside, 
          body header, 
          body button, 
          body nav, 
          body select, 
          body .no-print, 
          body [class*="no-print"], 
          body .no-print *, 
          aside.flex, 
          aside.flex-col, 
          header.flex, 
          button.flex,
          .no-print {
            display: none !important;
          }

          /* Reset layout structures */
          html, body {
            background: white !important;
            color: black !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
          }

          /* Reset container wrappers */
          .min-h-screen,
          .flex,
          .flex-col,
          .flex-1 {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
            background: transparent !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
          }

          /* Show print-only view */
          .print-only {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            position: static !important;
          }

          .print-only .grid {
            display: grid !important;
          }
          
          .print-only .flex {
            display: flex !important;
          }

          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: transparent !important;
          }

          /* Page formatting */
          tr, td, th, blockquote, pre {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
            margin-top: 0 !important;
            padding-top: 1.5rem !important;
          }

          /* Specific page layout overrides to allow vertical page stretching when printed */
          .print-page-layout {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: 85vh !important;
            box-sizing: border-box !important;
          }

          .print-page-layout-center {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            height: 85vh !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
        }
      `}} />
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shrink-0 sticky top-0 h-screen no-print">
        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-sm leading-none uppercase">{initialSettings?.bumdes_name || "BUMDES"}</h1>
            <p className="text-xs text-slate-400 font-medium mt-1 uppercase">
              {initialSettings?.village_name ? `DESA ${initialSettings.village_name}` : ""}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/50"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-4 rounded-2xl flex flex-col gap-3">
          <Link href="/profil" className="flex items-center gap-3 hover:bg-slate-100 p-2 -m-2 rounded-xl transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-semibold text-slate-800 text-xs truncate leading-none">{user.name}</p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 leading-none ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 w-full bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile Navigation */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 max-w-xs bg-white h-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 text-sm uppercase">{initialSettings?.bumdes_name || "BUMDES"}</span>
              </div>
              <button onClick={() => setIsMobileOpen(false)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Link
                href="/profil"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 hover:bg-slate-50 p-2 -m-2 rounded-xl transition-all cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="font-semibold text-slate-800 text-xs">{user.name}</p>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border mt-1 ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-3 py-2 w-full bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition-all duration-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Sistem
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 z-40 no-print">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
            </div>
          </div>

          <Link
            href="/profil"
            className="flex items-center gap-3 hover:bg-slate-50 p-2 -m-2 rounded-xl transition-all cursor-pointer"
          >
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-semibold leading-tight">{getRoleLabel(user.role)}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-emerald-600/20">
              {user.name ? user.name[0] : "A"}
            </div>
          </Link>
        </header>

        {/* Dynamic Page Children wrapped in SettingsProvider */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <SettingsProvider initialSettings={initialSettings}>
            {children}
          </SettingsProvider>
        </main>
      </div>
    </div>
  )
}
