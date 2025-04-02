"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  gender: z.enum(["Male", "Female", "Other"], {
    required_error: "Please select a gender.",
  }),
  age: z.coerce
    .number()
    .min(1, {
      message: "Age must be at least 1 year.",
    })
    .transform((val) => (isNaN(val) ? undefined : val))
    .pipe(z.number().min(1, { message: "Age must be at least 1 year." })),
  id_number: z.string().min(1, {
    message: "ID number is required.",
  }),
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

interface PatientEditFormProps {
  patient: {
    id: string
    name: string
    gender: string
    age: number
    id_number: string
    phone_number: string
    email?: string
    role: string
  }
  onSuccess: () => void
  onCancel: () => void
}

export function PatientEditForm({ patient, onSuccess, onCancel }: PatientEditFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patient.name,
      gender: patient.gender as "Male" | "Female" | "Other",
      age: patient.age,
      id_number: patient.id_number,
      phone_number: patient.phone_number,
      email: patient.email || "",
      role: patient.role as "Student" | "Permanent Employee" | "Contract Employee" | "Retired Employee" | "Dependent",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)

    try {
      // Check if another patient exists with the same phone number (excluding current patient)
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("phone_number", values.phone_number)
        .neq("id", patient.id)
        .single()

      if (existingPatient) {
        toast({
          title: "Phone number already exists",
          description: "Another patient is registered with this phone number",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Update patient
      const { error } = await supabase
        .from("patients")
        .update(values)
        .eq("id", patient.id)

      if (error) {
        throw error
      }

      // Show success message with longer duration
      toast({
        title: "✅ Success",
        description: `Patient ${values.name}'s details have been updated successfully`,
        variant: "default",
        duration: 5000, // Show for 5 seconds
      })

      // Wait a bit before closing to ensure toast is visible
      setTimeout(() => {
        onSuccess()
      }, 500)

    } catch (error) {
      console.error("Error updating patient:", error)
      toast({
        title: "❌ Error",
        description: "Failed to update patient details. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="Other">Other</SelectItem>
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
                <FormLabel>ID Number</FormLabel>
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
        </div>

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

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Patient"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 