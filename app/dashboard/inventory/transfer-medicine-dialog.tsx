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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  medicine_id: z.string().min(1, "Please select a medicine"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  min_stock_level: z.number().min(0, "Minimum stock level must be 0 or greater"),
})

type Medicine = {
  id: string
  medicine_name: string
  quantity: number
  unit: string
}

type TransferMedicineDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  masterInventory: Medicine[]
}

export function TransferMedicineDialog({
  open,
  onOpenChange,
  onSuccess,
  masterInventory,
}: TransferMedicineDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicine_id: "",
      quantity: 0,
      min_stock_level: 0,
    },
  })

  const supabase = createClient()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const selectedMedicine = masterInventory.find(m => m.id === values.medicine_id)
      if (!selectedMedicine) {
        toast.error("Please select a valid medicine")
        form.setError("medicine_id", {
          message: "Please select a valid medicine",
        })
        return
      }

      if (values.quantity > selectedMedicine.quantity) {
        toast.error(`Transfer quantity cannot exceed available quantity (${selectedMedicine.quantity} ${selectedMedicine.unit})`)
        form.setError("quantity", {
          message: "Transfer quantity cannot exceed available quantity",
        })
        return
      }

      // 1. Reduce quantity in master inventory
      const { error: masterError } = await supabase
        .from("master_inventory")
        .update({ 
          quantity: selectedMedicine.quantity - values.quantity 
        })
        .eq("id", values.medicine_id)

      if (masterError) {
        console.error("Master inventory update error:", masterError)
        toast.error(`Failed to update master inventory: ${masterError.message}`)
        form.setError("root", {
          message: "Failed to update master inventory",
        })
        return
      }

      // 2. Add or update pharmacy inventory
      const { data: existingPharmacy, error: queryError } = await supabase
        .from("pharmacy_inventory")
        .select("*")
        .eq("medicine_name", selectedMedicine.medicine_name)
        .single()

      if (queryError && queryError.code !== "PGRST116") { // PGRST116 means no rows found
        console.error("Pharmacy inventory query error:", queryError)
        // Rollback master inventory update
        await supabase
          .from("master_inventory")
          .update({ quantity: selectedMedicine.quantity })
          .eq("id", values.medicine_id)
        
        form.setError("root", {
          message: "Failed to query pharmacy inventory",
        })
        return
      }

      if (existingPharmacy) {
        // Update existing pharmacy inventory
        const { error: pharmacyError } = await supabase
          .from("pharmacy_inventory")
          .update({ 
            quantity: existingPharmacy.quantity + values.quantity,
            min_stock_level: values.min_stock_level
          })
          .eq("id", existingPharmacy.id)

        if (pharmacyError) {
          console.error("Pharmacy inventory update error:", pharmacyError)
          // Rollback master inventory update
          await supabase
            .from("master_inventory")
            .update({ quantity: selectedMedicine.quantity })
            .eq("id", values.medicine_id)
          
          form.setError("root", {
            message: "Failed to update pharmacy inventory",
          })
          return
        }
      } else {
        // Create new pharmacy inventory entry
        const { error: pharmacyError } = await supabase
          .from("pharmacy_inventory")
          .insert({
            medicine_name: selectedMedicine.medicine_name,
            quantity: values.quantity,
            unit: selectedMedicine.unit,
            min_stock_level: values.min_stock_level
          })

        if (pharmacyError) {
          console.error("Pharmacy inventory creation error:", pharmacyError)
          // Rollback master inventory update
          await supabase
            .from("master_inventory")
            .update({ quantity: selectedMedicine.quantity })
            .eq("id", values.medicine_id)
          
          form.setError("root", {
            message: "Failed to create pharmacy inventory entry",
          })
          return
        }
      }

      toast.success(`Successfully transferred ${values.quantity} ${selectedMedicine.unit} of ${selectedMedicine.medicine_name} to pharmacy`)
      form.reset()
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error("Unexpected error during transfer:", err)
      form.setError("root", {
        message: "An unexpected error occurred",
      })
    }
  }

  const selectedMedicine = masterInventory.find(
    (m) => m.id === form.watch("medicine_id")
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer to Pharmacy</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/15 p-3">
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              </div>
            )}
            <FormField
              control={form.control}
              name="medicine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicine</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a medicine" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {masterInventory.map((medicine) => (
                        <SelectItem key={medicine.id} value={medicine.id}>
                          {medicine.medicine_name} ({medicine.quantity} {medicine.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  {selectedMedicine && (
                    <p className="text-sm text-muted-foreground">
                      Available: {selectedMedicine.quantity} {selectedMedicine.unit}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Transfer</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
