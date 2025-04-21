import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { MobileNav } from "@/components/mobile-nav"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PJTAU Health Centre",
  description: "Healthcare Management System for PJTAU Health Centre",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          <div className="flex h-screen">
            <div className="fixed top-0 left-0 z-50 p-4 lg:hidden">
              <MobileNav />
            </div>
            <div className="hidden lg:block">
              <DashboardSidebar />
            </div>
            <main className="flex-1 overflow-y-auto p-6 lg:pl-[256px]">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}

import './globals.css'