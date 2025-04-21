"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientDetails } from "@/components/patient-details"
import { PatientEditForm } from "@/components/patient-edit-form"
import { NewVisitForm } from "@/components/new-visit-form"
import { VisitHistory } from "@/components/visit-history"
import { ReviewOpForm } from "@/components/review-op-form"
import { ArrowLeft, CheckCircle2, History, PlusCircle, Printer, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PatientPageClientProps {
  id: string
}

export function PatientPageClient({ id }: PatientPageClientProps) {
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isCreatingVisit, setIsCreatingVisit] = useState(false)
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [visitSuccess, setVisitSuccess] = useState(false)
  const [currentVisit, setCurrentVisit] = useState<any>(null)
  const [previousVisit, setPreviousVisit] = useState<any>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<string>("Dr. P. Indrasen Reddy")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        // Try to fetch from localStorage first as a fallback
        let cachedPatient = null
        try {
          const cachedData = localStorage.getItem('currentPatient')
          if (cachedData) {
            cachedPatient = JSON.parse(cachedData)
          }
        } catch (parseError) {
          console.error("Error parsing cached patient data:", parseError)
        }
        
        // Only use the cached patient if the ID matches
        if (cachedPatient && cachedPatient.id === id) {
          setPatient(cachedPatient)
          setLoading(false)
          return
        }
        
        // If no cached patient or ID doesn't match, fetch from database
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", id)
          .single()

        if (error) {
          throw error
        }

        setPatient(data)
        // Update the cache
        try {
          localStorage.setItem('currentPatient', JSON.stringify(data))
        } catch (cacheError) {
          console.error("Error caching patient data:", cacheError)
        }
      } catch (error) {
        console.error("Error fetching patient:", error)
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [id, supabase, toast])

  // Handle automatic printing when print=true in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const shouldPrint = searchParams.get('print') === 'true'
    
    if (shouldPrint && patient && !loading) {
      handlePrint()
      // Remove the print parameter from URL
      searchParams.delete('print')
      const newUrl = window.location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      router.replace(newUrl)
    }
  }, [patient, loading])

  useEffect(() => {
    // Fetch the most recent and previous visit for this patient
    const fetchVisits = async () => {
      if (!patient?.id) return;
      
      try {
        // Fetch two most recent visits
        const { data, error } = await supabase
          .from("visits")
          .select("*")
          .eq("patient_id", patient.id)
          .order("visit_date", { ascending: false })
          .limit(2);
          
        if (error) {
          console.error("Error fetching visits:", error);
          toast({
            title: "Error",
            description: "Failed to load visit history",
            variant: "destructive",
          });
          return;
        }
        
        if (data && data.length > 0) {
          // First item is the current/most recent visit
          setCurrentVisit(data[0]);
          
          // Second item (if exists) is the previous visit
          if (data.length > 1) {
            setPreviousVisit(data[1]);
          } else {
            setPreviousVisit(null);
          }
        } else {
          setCurrentVisit(null);
          setPreviousVisit(null);
        }
      } catch (error) {
        console.error("Error in fetchVisits:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading visit history",
          variant: "destructive",
        });
      }
    };
    
    fetchVisits();
  }, [patient, supabase, toast]);

  useEffect(() => {
    if (isPrinting) {
      // Add a print style to hide the header
      const style = document.createElement('style')
      style.id = 'print-styles'
      style.innerHTML = `
        @media print {
          header, nav, .main-header, .header, #header, [class*="header"], [class*="navbar"] {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `
      document.head.appendChild(style)
      
      return () => {
        // Clean up when printing is done
        const printStyle = document.getElementById('print-styles')
        if (printStyle) {
          document.head.removeChild(printStyle)
        }
      }
    }
  }, [isPrinting])

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        setIsPrinting(false)
      }, 500)
    }, 100)
  }

  const handleNewVisit = async () => {
    if (isCreatingVisit) return;
    setIsCreatingVisit(true);
    setVisitSuccess(false);

    try {
      const visitData = {
        patient_id: patient.id,
        visit_date: new Date().toISOString(),
        doctor_name: selectedDoctor
      }

      // Insert with returning to get the complete visit data
      const { data, error } = await supabase
        .from("visits")
        .insert([visitData])
        .select()

      if (error) throw error

      console.log("Visit created successfully:", data);

      // Update the current visit with the new visit data
      if (data && data.length > 0) {
        setCurrentVisit(data[0]);
        // Move the previous current visit to previousVisit
        if (currentVisit) {
          setPreviousVisit(currentVisit);
        }
      }

      // Show success state
      setVisitSuccess(true)
      
      // Close dialog after showing success
      setTimeout(() => {
        setShowVisitDialog(false)
        setVisitSuccess(false)
      }, 1500)

      toast({
        title: "Success!",
        description: "New visit has been recorded for the patient",
        variant: "default",
      })
    } catch (error) {
      console.error("Error creating visit:", error)
      toast({
        title: "Error",
        description: "Failed to record the visit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setIsCreatingVisit(false)
      }, 500)
    }
  }

  const handleEditSuccess = async () => {
    // Refetch patient data
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        throw error
      }

      setPatient(data)
      // Update the cache
      try {
        localStorage.setItem('currentPatient', JSON.stringify(data))
      } catch (cacheError) {
        console.error("Error caching patient data:", cacheError)
      }

      // Show a confirmation toast when data is refreshed
      toast({
        title: "✅ Profile Updated",
        description: "Patient profile has been updated and refreshed",
        variant: "default",
        duration: 3000,
      })

    } catch (error) {
      console.error("Error fetching updated patient:", error)
      toast({
        title: "Error",
        description: "Failed to refresh patient data",
        variant: "destructive",
      })
    }

    setShowEditDialog(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Patient Not Found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isPrinting && (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">{patient.name}</h2>
                <p className="text-muted-foreground">
                  {patient.role} • {patient.id_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Patient
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowVisitDialog(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Visit
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print OP Form
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>Personal and contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <PatientDetails patient={patient} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visit History</CardTitle>
                <CardDescription>Previous visits and diagnoses</CardDescription>
              </CardHeader>
              <CardContent>
                <VisitHistory patientId={patient.id} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Patient Details</DialogTitle>
            <DialogDescription>
              Update the patient's information. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <PatientEditForm 
            patient={patient} 
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Visit</DialogTitle>
            <DialogDescription>
              Record a new visit for {patient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            {visitSuccess ? (
              <div className="flex flex-col items-center gap-2 text-green-600">
                <CheckCircle2 className="h-12 w-12 animate-in zoom-in" />
                <p className="text-sm font-medium">Visit Recorded Successfully</p>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div>
                  <Label>Consulting Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select consulting doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr. P. Indrasen Reddy">Dr. P. Indrasen Reddy</SelectItem>
                      <SelectItem value="Dr. Chandana Reddy">Dr. Chandana Reddy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleNewVisit}
                  disabled={isCreatingVisit}
                  className="w-full"
                >
                  {isCreatingVisit ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Recording Visit...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Visit
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className={isPrinting ? "block" : "hidden print:block"}>
        <ReviewOpForm patient={patient} visit={currentVisit} previousVisit={previousVisit} />
      </div>
    </div>
  )
}