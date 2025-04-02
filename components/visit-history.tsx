"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

interface VisitHistoryProps {
  patientId: string
}

export function VisitHistory({ patientId }: VisitHistoryProps) {
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const fetchVisits = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("visits")
        .select("id, visit_date, doctor_name")
        .eq("patient_id", patientId)
        .order("visit_date", { ascending: false })

      if (error) {
        console.error("Error fetching visits:", error)
        toast({
          title: "Error",
          description: "Failed to load visit history",
          variant: "destructive",
        })
        return
      }

      setVisits(data || [])
    } catch (error) {
      console.error("Error in fetchVisits:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading visit history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchVisits()

    // Set up real-time subscription with detailed logging
    const channel = supabase
      .channel(`visits-${patientId}-${Date.now()}`) // Using unique channel name
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visits',
          filter: `patient_id=eq.${patientId}`
        },
        (payload) => {
          console.log('Received real-time update:', payload)
          
          // Add the new visit at the top of the list
          if (payload.new && payload.new.id) {
            const newVisit = {
              id: payload.new.id,
              visit_date: payload.new.visit_date,
              doctor_name: payload.new.doctor_name
            }
            
            console.log('Adding new visit to list:', newVisit)
            setVisits(currentVisits => [newVisit, ...currentVisits])
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for patient ${patientId}:`, status)
      })

    return () => {
      console.log(`Unsubscribing from channel for patient ${patientId}`)
      channel.unsubscribe()
    }
  }, [patientId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-muted/50">
        <h3 className="text-lg font-medium mb-2">No Visit History</h3>
        <p className="text-muted-foreground">This patient has no recorded visits yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2" data-testid="visit-history">
      {visits.map((visit) => {
        const visitDate = new Date(visit.visit_date)
        const dayOfWeek = visitDate.toLocaleDateString('en-US', { weekday: 'long' })
        const formattedDate = visitDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        const formattedTime = visitDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })

        return (
          <div 
            key={visit.id} 
            className="p-4 border rounded-lg hover:bg-muted/50"
          >
            <p className="font-medium">{formattedDate}</p>
            <p className="text-sm text-muted-foreground">{dayOfWeek} at {formattedTime}</p>
            <p className="text-sm mt-1 text-primary">Consulting Doctor: {visit.doctor_name || "Not specified"}</p>
          </div>
        )
      })}
    </div>
  )
}

