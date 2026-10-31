import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import AppDialogProvider from "@/components/ui/AppDialog"

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Sistem Informasi Manajemen BUMDES",
  description: "Aplikasi manajemen Badan Usaha Milik Desa (BUMDES) dan otomasi Laporan Pertanggungjawaban (LPJ)",
  icons: {
    icon: [
      { url: "/api/favicon", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" }
    ],
    shortcut: "/favicon.ico",
    apple: "/logo-bumdes.png"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${fontSans.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="/api/favicon" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-bumdes.png" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <AppDialogProvider>
          {children}
        </AppDialogProvider>
      </body>
    </html>
  )
}
