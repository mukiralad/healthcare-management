'use client'

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false} 
      disableTransitionOnChange
      storageKey="health-centre-theme"
    >
      <div className="min-h-screen bg-background">
        {children}
        <Toaster richColors position="top-right" />
      </div>
    </ThemeProvider>
  )
}
