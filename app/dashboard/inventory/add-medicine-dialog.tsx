"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { MedicineAutocomplete } from "./medicine-autocomplete"

const formSchema = z.object({
  medicine_name: z.string().min(1, "Medicine name is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),

  min_stock_level: z.number().min(0, "Minimum stock level must be 0 or greater").optional(),
})

type AddMedicineDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  inventoryType: "master" | "pharmacy"
}

export function AddMedicineDialog({
  open,
  onOpenChange,
  onSuccess,
  inventoryType,
}: AddMedicineDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicine_name: "",
      quantity: 0,

      min_stock_level: 0,
    },
  })

  const supabase = createClient()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const table = inventoryType === "master" ? "master_inventory" : "pharmacy_inventory"
      
      // Check if medicine already exists
      const { data: existingMedicine } = await supabase
        .from(table)
        .select('*')
        .eq('medicine_name', values.medicine_name)
        .single()

      if (existingMedicine) {
        // Update existing medicine quantity
        const { error } = await supabase
          .from(table)
          .update({ 
            quantity: existingMedicine.quantity + values.quantity,

            ...(inventoryType === 'pharmacy' && { min_stock_level: values.min_stock_level })
          })
          .eq('medicine_name', values.medicine_name)

        if (error) {
          console.error('Supabase error:', error)
          const errorMessage = error.message || 'Failed to update medicine'
          toast.error(`Failed to update ${values.medicine_name}: ${errorMessage}`)
          form.setError('root', { message: errorMessage })
          return
        }

        toast.success(`Updated quantity of ${values.medicine_name} in ${inventoryType} inventory`)
      } else {
        // Insert new medicine
        const dataToInsert = inventoryType === "master" 
          ? {
              medicine_name: values.medicine_name,
              quantity: values.quantity,

            }
          : values
        
        const { error } = await supabase
          .from(table)
          .insert(dataToInsert)
          .select()

        if (error) {
          console.error('Supabase error:', error)
          const errorMessage = error.message || 'Failed to add medicine'
          toast.error(`Failed to add ${values.medicine_name}: ${errorMessage}`)
          form.setError('root', { message: errorMessage })
          return
        }

        toast.success(`${values.medicine_name} has been added to ${inventoryType} inventory`)
      }

      form.reset()
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error(`Failed to add ${values.medicine_name}: An unexpected error occurred`)
      form.setError('root', {
        message: 'An unexpected error occurred'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {inventoryType === "master" ? "Add to Master Inventory" : "Add to Pharmacy"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="medicine_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicine Name</FormLabel>
                  {inventoryType === "pharmacy" ? (
                    <FormControl>
                      <MedicineAutocomplete
                        onSelect={(medicine) => {
                          form.setValue("medicine_name", medicine.medicine_name)

                        }}
                      />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {inventoryType === "pharmacy" && (
              <FormField
                control={form.control}
                name="min_stock_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.formState.errors.root && (
              <div className="text-red-500 text-sm">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full">
              Add Medicine
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
