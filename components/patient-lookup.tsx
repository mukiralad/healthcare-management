"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientCard } from "@/components/patient-card"
import { useToast } from "@/hooks/use-toast"
import { Search } from "lucide-react"

export function PatientLookup() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber || phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setNotFound(false)

    try {
      const { data, error } = await supabase.from("patients").select("*").eq("phone_number", phoneNumber).single()

      if (error) {
        if (error.code === "PGRST116") {
          setNotFound(true)
          setPatient(null)
        } else {
          throw error
        }
      } else {
        setPatient(data)
        setNotFound(false)
      }
    } catch (error) {
      console.error("Error searching for patient:", error)
      toast({
        title: "Search failed",
        description: "There was an error searching for the patient",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewPatient = (id: string) => {
    router.push(`/dashboard/patient/${id}`)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <Input
              id="phone"
              placeholder="Enter 10-digit mobile number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>
      </form>

      {notFound && (
        <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-muted/50">
          <h3 className="text-lg font-medium mb-2">Patient Not Found</h3>
          <p className="text-muted-foreground mb-4">No patient found with the provided phone number.</p>
          <Button variant="outline" onClick={() => router.push("/dashboard?tab=register")}>
            Register New Patient
          </Button>
        </div>
      )}

      {patient && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Patient Found</h3>
          <PatientCard patient={patient} onView={() => handleViewPatient(patient.id)} />
        </div>
      )}
    </div>
  )
}

