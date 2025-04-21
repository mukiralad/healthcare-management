"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CheckCircle2, Printer, X } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  gender: z.enum(["Male", "Female"], {
    required_error: "Please select a gender.",
  }),
  age: z.coerce
    .number()
    .min(1, {
      message: "Age must be at least 1 year.",
    })
    .transform((val) => (isNaN(val) ? undefined : val))
    .pipe(z.number().min(1, { message: "Age must be at least 1 year." })),
  id_number: z.string().optional().or(z.literal("")),
  phone_number: z
    .string()
    .length(10, {
      message: "Phone number must be exactly 10 digits.",
    })
    .regex(/^\d+$/, {
      message: "Phone number must contain only digits.",
    }),
  email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .optional()
    .or(z.literal("")),
  role: z.enum(["Student", "Permanent Employee", "Contract Employee", "Retired Employee", "Dependent"], {
    required_error: "Please select a role.",
  }),
})

export function PatientRegistrationForm() {
  const [loading, setLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<string>("Dr. P. Indrasen Reddy")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [registeredPatientId, setRegisteredPatientId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gender: "Male" as "Male" | "Female",
      age: 0,
      id_number: "",
      phone_number: "",
      email: "",
      role: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)

    try {
      // Check if patient with this phone number already exists
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("phone_number", values.phone_number)
        .single()

      if (existingPatient) {
        toast({
          title: "Patient already exists",
          description: "A patient with this phone number is already registered",
          variant: "destructive",
        })
        return
      }

      // Insert new patient
      const { data, error } = await supabase.from("patients").insert([values]).select()

      if (error) {
        throw error
      }

      // Create initial visit record for registration
      if (data && data.length > 0) {
        const visitData = {
          patient_id: data[0].id,
          visit_date: new Date().toISOString(),
          doctor_name: selectedDoctor,
          presenting_complaints: "",
          principal_diagnosis: "",
          follow_up_advice: ""
        }

        const { error: visitError } = await supabase
          .from("visits")
          .insert([visitData])

        if (visitError) {
          console.error("Error creating registration visit:", visitError)
          toast({
            title: "Notice",
            description: "Patient registered but visit record creation failed",
            variant: "default",
          })
        }
      }

      // Store the registered patient ID and show success dialog
      if (data && data.length > 0) {
        setRegisteredPatientId(data[0].id)
        setShowSuccessDialog(true)
      }

      form.reset()
    } catch (error) {
      console.error("Error registering patient:", error)
      toast({
        title: "Error",
        description: "Failed to register patient. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="col-span-2">
              <Label>Registering Doctor</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select registering doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dr. P. Indrasen Reddy">Dr. P. Indrasen Reddy</SelectItem>
                  <SelectItem value="Dr. Chandana Reddy">Dr. Chandana Reddy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter patient's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Number (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Permanent Employee">Permanent Employee</SelectItem>
                      <SelectItem value="Contract Employee">Contract Employee</SelectItem>
                      <SelectItem value="Retired Employee">Retired Employee</SelectItem>
                      <SelectItem value="Dependent">Dependent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registering..." : "Register Patient"}
          </Button>
        </form>
      </Form>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registration Successful</DialogTitle>
            <DialogDescription>
              The patient has been successfully registered in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="flex flex-col items-center gap-2 text-green-600">
              <CheckCircle2 className="h-12 w-12 animate-in zoom-in" />
              <p className="text-sm font-medium">Patient Registered Successfully</p>
            </div>
            <div className="flex flex-col w-full gap-2">
              <Button 
                className="w-full"
                onClick={() => {
                  router.push(`/dashboard/patient/${registeredPatientId}`)
                  setShowSuccessDialog(false)
                }}
              >
                View Patient Profile
              </Button>
            </div>
          </div>
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => setShowSuccessDialog(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}

