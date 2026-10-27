import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Sistem Informasi Manajemen BUMDES",
  description: "Aplikasi manajemen Badan Usaha Milik Desa (BUMDES) dan otomasi Laporan Pertanggungjawaban (LPJ)",
}

import AppDialogProvider from "@/components/ui/AppDialog"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${fontSans.variable} scroll-smooth`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <AppDialogProvider>
          {children}
        </AppDialogProvider>
      </body>
    </html>
  )
}
