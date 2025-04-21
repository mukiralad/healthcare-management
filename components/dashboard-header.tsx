"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DashboardHeader() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)
    }

    getUser()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login")
      } else if (session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-full px-4 md:px-6 lg:px-8 mx-auto flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="/TSAU_Logo.png" 
            alt="PJTAU Logo" 
            width={40} 
            height={40} 
            className="object-contain"
          />
          <h1 className="text-xl font-bold text-primary">PJTAU Health Centre</h1>
        </Link>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

