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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuantityInput } from "@/components/ui/quantity-input"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  medicine_name: z.string().min(1, "Medicine name is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  category: z.enum(["TDSR", "PDSR"], { required_error: "Category is required" }),
  location: z.string().optional(),
  stock_book_page_number: z.string().min(1, "Stock book page number is required"),
  min_stock_level: z.number().min(0, "Minimum stock level must be 0 or greater").optional(),
})

type Medicine = {
  id: string
  medicine_name: string
  quantity: number
  category: 'TDSR' | 'PDSR'
  location?: string
  stock_book_page_number: string
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
      category: "TDSR",
      location: "",
      stock_book_page_number: "",
      min_stock_level: 0,
    },
  })

  useEffect(() => {
    if (medicine) {
      form.reset({
        medicine_name: medicine.medicine_name,
        quantity: medicine.quantity,
        category: medicine.category,
        location: medicine.location || "",
        stock_book_page_number: medicine.stock_book_page_number,
        min_stock_level: medicine.min_stock_level,
      })
    }
  }, [medicine, form])

  const supabase = createClient()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!medicine) return

    const table = showMinStock ? "pharmacy_inventory" : "master_inventory"
    
    // Remove min_stock_level from values if updating master inventory
    const updateValues = {
      medicine_name: values.medicine_name,
      quantity: values.quantity,
      category: values.category,
      location: values.location,
      stock_book_page_number: values.stock_book_page_number,
      ...(showMinStock && { min_stock_level: Number(values.min_stock_level) })
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
                    <QuantityInput 
                      {...field}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TDSR">TDSR</SelectItem>
                      <SelectItem value="PDSR">PDSR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock_book_page_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Book Page Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                      <QuantityInput 
                        {...field}
                        onChange={field.onChange}
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
