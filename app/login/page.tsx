"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LandingHeader } from "@/components/landing-header"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const loginAttemptsRef = useRef(0)
  const lastAttemptTimeRef = useRef(0)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Rate limiting check
    const now = Date.now()
    const timeSinceLastAttempt = now - lastAttemptTimeRef.current
    const COOLDOWN_PERIOD = 2000 // 2 seconds cooldown
    const MAX_ATTEMPTS = 5
    const RESET_PERIOD = 300000 // 5 minutes

    // Reset attempts if enough time has passed
    if (timeSinceLastAttempt > RESET_PERIOD) {
      loginAttemptsRef.current = 0
    }

    // Check cooldown period
    if (timeSinceLastAttempt < COOLDOWN_PERIOD) {
      toast({
        title: "Please wait",
        description: "Please wait a few seconds before trying again",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Check max attempts
    if (loginAttemptsRef.current >= MAX_ATTEMPTS) {
      const minutesLeft = Math.ceil((RESET_PERIOD - timeSinceLastAttempt) / 60000)
      toast({
        title: "Too many attempts",
        description: `Please wait ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''} before trying again`,
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Update attempt tracking
    loginAttemptsRef.current += 1
    lastAttemptTimeRef.current = now
    try {
      if (!email || !password) {
        throw new Error("Please enter both email and password")
      }
      console.log("Attempting login with email:", `${email}@healthcare.local`)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${email}@healthcare.local`,
        password,
      })

      if (error) {
        console.error("Supabase auth error:", error)
        let errorMessage = "Authentication failed"
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid username or password"
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Too many login attempts. Please wait a few minutes."
        } else if (error.message.includes("Refresh Token")) {
          errorMessage = "Session expired. Please try again."
          // Clear any stale session data
          await supabase.auth.signOut()
        }
        
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!data?.user) {
        console.error("No user data returned")
        throw new Error("Login failed - no user data")
      }

      console.log("Login successful, redirecting...")
      router.push("/dashboard")
      router.refresh() // Refresh to update server-side session
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Authentication failed",
        description: error?.message || "Please check your credentials and try again. If the problem persists, ensure you're connected to the internet.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>Enter your credentials to access the healthcare system</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
              <p className="mt-2 text-xs text-center text-gray-500">
                Use username: <strong>admin</strong> and password: <strong>password</strong>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}
