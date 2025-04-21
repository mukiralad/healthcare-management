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
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  medicine_name: z.string().min(1, "Medicine name is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),

  min_stock_level: z.number().min(0, "Minimum stock level must be 0 or greater").optional(),
})

type Medicine = {
  id: string
  medicine_name: string
  quantity: number

  min_stock_level?: number
}

type UpdateMedicineDialogProps = {
  medicine: Medicine | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  showMinStock: boolean
}

export function UpdateMedicineDialog({
  medicine,
  open,
  onOpenChange,
  onSuccess,
  showMinStock,
}: UpdateMedicineDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicine_name: "",
      quantity: 0,

      min_stock_level: 0,
    },
  })

  useEffect(() => {
    if (medicine) {
      form.reset({
        medicine_name: medicine.medicine_name,
        quantity: medicine.quantity,

        min_stock_level: medicine.min_stock_level,
      })
    }
  }, [medicine, form])

  const supabase = createClient()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!medicine) return

    const table = showMinStock ? "pharmacy_inventory" : "master_inventory"
    
    // Remove min_stock_level from values if updating master inventory
    const updateValues = !showMinStock ? values : {
      medicine_name: values.medicine_name,
      quantity: values.quantity,

    }

    const { error } = await supabase
      .from(table)
      .update(updateValues)
      .eq("id", medicine.id)

    if (!error) {
      toast.success(`${values.medicine_name} has been updated successfully`)
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error(`Failed to update ${values.medicine_name}: ${error.message}`)
    }
  }

  if (!medicine) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Medicine</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="medicine_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicine Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {showMinStock && (
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
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Medicine</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
