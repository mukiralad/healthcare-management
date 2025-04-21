"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, Users, Pill } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  isActive: boolean
}

function NavLink({ href, icon, children, isActive }: NavLinkProps) {
  return (
    <Link href={href} passHref>
      <Button 
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-10 transition-all duration-200",
          isActive && "bg-primary/10 hover:bg-primary/20 text-foreground font-medium"
        )}
      >
        {icon}
        {children}
      </Button>
    </Link>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  
  return (
    <div className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-64 transition-all duration-300 ease-in-out">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-3 py-6 px-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">MAIN MENU</p>
          <NavLink href="/dashboard" icon={<Home className="h-4 w-4" />} isActive={pathname === "/dashboard"}>Dashboard</NavLink>
          <NavLink href="/patients" icon={<Users className="h-4 w-4" />} isActive={pathname.startsWith("/patients")}>Patients</NavLink>
          <NavLink href="/dashboard/inventory" icon={<Pill className="h-4 w-4" />} isActive={pathname.startsWith("/dashboard/inventory")}>Inventory</NavLink>

        </div>
      </ScrollArea>
    </div>
  )
}

