"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { PatientCard } from "@/components/patient-card"
import { useToast } from "@/hooks/use-toast"

export function RecentPatients() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) {
          throw error
        }

        setPatients(data || [])
      } catch (error) {
        console.error("Error fetching recent patients:", error)
        toast({
          title: "Error",
          description: "Failed to load recent patients",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRecentPatients()
  }, [supabase, toast])

  const handleViewPatient = (id: string) => {
    router.push(`/dashboard/patient/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-muted/50">
        <h3 className="text-lg font-medium mb-2">No Recent Patients</h3>
        <p className="text-muted-foreground mb-4">No patients have been registered yet.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard?tab=register")}>
          Register New Patient
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} onView={() => handleViewPatient(patient.id)} />
      ))}
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => router.push("/dashboard/patients")}>
          View All Patients
        </Button>
      </div>
    </div>
  )
}

