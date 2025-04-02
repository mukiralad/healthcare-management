"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Home, Users } from "lucide-react"

export function DashboardSidebar() {
  const pathname = usePathname()
  
  return (
    <div className="hidden border-r bg-background/95 lg:block w-64">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-3 py-6 px-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">MAIN MENU</p>
          <Link href="/dashboard" passHref>
            <Button 
              variant={pathname === "/dashboard" ? "default" : "ghost"} 
              className="w-full justify-start gap-3 h-10"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/patients" passHref>
            <Button 
              variant={pathname.startsWith("/patients") ? "default" : "ghost"} 
              className="w-full justify-start gap-3 h-10"
            >
              <Users className="h-4 w-4" />
              Patients
            </Button>
          </Link>
          <Link href="/dashboard" passHref>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-10"
            >
              <FileText className="h-4 w-4" />
              Reports
            </Button>
          </Link>
        </div>
      </ScrollArea>
    </div>
  )
}

