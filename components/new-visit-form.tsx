"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  principal_diagnosis: z.string().optional(),
  presenting_complaints: z.string().optional(),
  follow_up_advice: z.string().optional(),
  doctor_name: z.enum(["Dr. P. Indrasen Reddy", "Dr. Seetha Reddy"], {
    required_error: "Please select the consulting doctor.",
  }),
  _temperature: z.string().optional(),
  _blood_pressure: z.string().optional(),
  _pulse_rate: z.coerce.number().optional(),
  _respiratory_rate: z.coerce.number().optional(),
  _oxygen_saturation: z.coerce.number().min(0).max(100).optional(),
})

interface NewVisitFormProps {
  patientId: string
}

export function NewVisitForm({ patientId }: NewVisitFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal_diagnosis: "",
      presenting_complaints: "",
      follow_up_advice: "",
      doctor_name: undefined,
      _temperature: "",
      _blood_pressure: "",
      _pulse_rate: undefined,
      _respiratory_rate: undefined,
      _oxygen_saturation: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)

    try {
      const dbValues = {
        patient_id: patientId,
        principal_diagnosis: values.principal_diagnosis,
        presenting_complaints: values.presenting_complaints,
        follow_up_advice: values.follow_up_advice,
        doctor_name: values.doctor_name,
      }

      const { data, error } = await supabase
        .from("visits")
        .insert([dbValues])
        .select()

      if (error) {
        throw error
      }

      const vitals = {
        temperature: values._temperature,
        blood_pressure: values._blood_pressure,
        pulse_rate: values._pulse_rate,
        respiratory_rate: values._respiratory_rate,
        oxygen_saturation: values._oxygen_saturation,
      }
      sessionStorage.setItem(`visit_vitals_${data[0].id}`, JSON.stringify(vitals))

      toast({
        title: "Visit recorded successfully",
        description: "The patient visit has been recorded",
      })

      form.reset()

      router.refresh()
    } catch (error) {
      console.error("Error recording visit:", error)
      toast({
        title: "Failed to record visit",
        description: "There was an error recording the patient visit",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="doctor_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consulting Doctor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select consulting doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Dr. P. Indrasen Reddy">Dr. P. Indrasen Reddy</SelectItem>
                    <SelectItem value="Dr. Seetha Reddy">Dr. Seetha Reddy</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="presenting_complaints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presenting Complaints</FormLabel>
                <FormControl>
                  <Textarea placeholder="Patient's complaints and symptoms" className="min-h-[80px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="principal_diagnosis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Principal Diagnosis</FormLabel>
                <FormControl>
                  <Textarea placeholder="Primary diagnosis" className="min-h-[80px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="follow_up_advice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Follow-up Advice</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Recommendations and follow-up instructions"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="_temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature (°C)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 37.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="_blood_pressure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Pressure (mmHg)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 120/80" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="_pulse_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pulse Rate (bpm)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="_respiratory_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Respiratory Rate (breaths/min)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="_oxygen_saturation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oxygen Saturation (%)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
          {loading ? "Saving..." : "Record Visit"}
        </Button>
      </form>
    </Form>
  )
}

