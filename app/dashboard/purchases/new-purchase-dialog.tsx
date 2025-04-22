"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MedicineAutocomplete } from "../inventory/medicine-autocomplete"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PurchaseItem {
  medicine_name: string
  batch_number: string
  expiry_date: Date | null
  quantity: number | null
  unit_price: number | null
  total_price: number | null
  category?: 'TDSR' | 'PDSR'
  location?: string
  stock_book_page_number?: string
  is_new_medicine: boolean
}

interface NewPurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NewPurchaseDialog({ open, onOpenChange, onSuccess }: NewPurchaseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(new Date())
  const [items, setItems] = useState<PurchaseItem[]>([{
    medicine_name: "",
    batch_number: "",
    expiry_date: null,
    quantity: null,
    unit_price: null,
    total_price: null,
    is_new_medicine: true
  }])

  const [formData, setFormData] = useState({
    invoice_number: "",
    supplier_name: "",
    notes: ""
  })

  const addItem = () => {
    setItems([...items, {
      medicine_name: "",
      batch_number: "",
      expiry_date: null,
      quantity: null,
      unit_price: null,
      total_price: null,
      is_new_medicine: true
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    setItems(newItems)
  }

  const handleSubmit = async () => {
    try {
      // Debug logging
      console.log('Form data:', formData)
      console.log('Items:', items)
      console.log('Purchase date:', purchaseDate)
      setIsSubmitting(true)
      const supabase = createClient()

      // Validate required fields for new medicines
      for (const item of items) {
        if (item.is_new_medicine) {
          if (!item.medicine_name) throw new Error("Medicine name is required for new medicines")
          if (!item.category) throw new Error("Category is required for new medicines")
          if (!item.stock_book_page_number) throw new Error("Stock book page number is required for new medicines")
        }
      }

      // Convert numeric strings to numbers and ensure proper data types
      const processedItems = items.map(item => {
        // Keep the original item for type safety
        const processedItem = { ...item }

        // Convert numeric fields
        if (item.quantity) processedItem.quantity = parseInt(item.quantity.toString())
        if (item.total_price) processedItem.total_price = parseFloat(item.total_price.toString())
        if (item.unit_price) processedItem.unit_price = parseFloat(item.unit_price.toString())

        return processedItem
      })

      // Calculate total amount
      const total_amount = processedItems.reduce((sum, item) => sum + (item.total_price || 0), 0)

      // Validate all fields
      if (!formData.invoice_number) throw new Error('Invoice number is required')
      if (!formData.supplier_name) throw new Error('Supplier name is required')
      if (!purchaseDate) throw new Error('Purchase date is required')
      
      // Validate items
      if (items.length === 0) throw new Error('At least one item is required')
      
      items.forEach((item, index) => {
        if (!item.medicine_name) throw new Error(`Medicine name is required for item ${index + 1}`)
        if (!item.batch_number) throw new Error(`Batch number is required for item ${index + 1}`)
        if (!item.expiry_date) throw new Error(`Expiry date is required for item ${index + 1}`)
        if (!item.quantity) throw new Error(`Quantity is required for item ${index + 1}`)
        if (!item.total_price) throw new Error(`Total price is required for item ${index + 1}`)
        
        if (item.is_new_medicine) {
          if (!item.category) throw new Error(`Category is required for new medicine ${item.medicine_name}`)
          if (!item.stock_book_page_number) throw new Error(`Stock book page number is required for new medicine ${item.medicine_name}`)
        }
      })

      // For new medicines, first insert them into master_inventory and get their IDs
      for (let i = 0; i < processedItems.length; i++) {
        const item = processedItems[i]
        if (item.is_new_medicine) {
          console.log('Creating new medicine:', item)
          const { data: newMedicine, error: masterInventoryError } = await supabase
            .from("master_inventory")
            .insert({
              medicine_name: item.medicine_name,
              category: item.category,
              location: item.location,
              stock_book_page_number: item.stock_book_page_number,
              quantity: 0 // Initial quantity will be updated after purchase
            })
            .select()
            .single()

          if (masterInventoryError) throw masterInventoryError
          
          // Update the item with the new medicine name if needed
          if (newMedicine && !item.medicine_name) {
            items[i] = {
              ...item,
              medicine_name: newMedicine.medicine_name
            }
          }
        }
      }

      // Insert purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          invoice_number: formData.invoice_number,
          supplier_name: formData.supplier_name,
          purchase_date: purchaseDate?.toISOString(),
          total_amount,
          notes: formData.notes
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Insert purchase items
      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(
          processedItems.map(item => ({
            purchase_id: purchase.id,
            medicine_name: item.medicine_name,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date?.toISOString(),
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))
        )

      if (itemsError) throw itemsError

      // Show success message
      alert('Purchase created successfully!')

      onSuccess()
      resetForm()
      onOpenChange(false) // Close the dialog
    } catch (error) {
      console.error('Full error object:', error)
      
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
      }
      
      // Handle Supabase errors
      if (typeof error === 'object' && error !== null) {
        const supabaseError = error as any
        if (supabaseError.code || supabaseError.message || supabaseError.details) {
          console.error("Supabase error details:", {
            code: supabaseError.code,
            message: supabaseError.message,
            details: supabaseError.details,
            hint: supabaseError.hint
          })
          alert(supabaseError.message || supabaseError.details || 'Database error occurred')
          return
        }
      }
      
      // Generic error
      alert(error instanceof Error ? error.message : 'An error occurred while creating the purchase')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      invoice_number: "",
      supplier_name: "",
      notes: ""
    })
    setPurchaseDate(new Date())
    setItems([{
      medicine_name: "",
      batch_number: "",
      expiry_date: null,
      quantity: null,
      unit_price: null,
      total_price: null,
      is_new_medicine: true
    }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Purchase</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoice-number" className="text-right">
              Invoice Number
            </Label>
            <Input
              id="invoice-number"
              className="col-span-3"
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier-name" className="text-right">
              Supplier Name
            </Label>
            <Input
              id="supplier-name"
              className="col-span-3"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Purchase Date</Label>
            <Input
              type="date"
              className="col-span-3"
              value={purchaseDate ? format(purchaseDate, "yyyy-MM-dd") : ""}
              onChange={(e) => setPurchaseDate(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Items</h4>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="space-y-2">
                    <Label>Medicine Name</Label>
                    <div className="flex items-center gap-2">
                      {!item.is_new_medicine ? (
                        <>
                          <MedicineAutocomplete
                            onSelect={(medicine) => {
                              updateItem(index, "medicine_name", medicine.medicine_name)
                              updateItem(index, "is_new_medicine", false)
                            }}
                          />
                          <Button
                            variant="ghost"
                            onClick={() => {
                              updateItem(index, "medicine_name", "")
                              updateItem(index, "is_new_medicine", true)
                            }}
                            className="px-3"
                          >
                            New
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            value={item.medicine_name}
                            onChange={(e) => updateItem(index, "medicine_name", e.target.value)}
                            placeholder="Enter medicine name"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            onClick={() => {
                              updateItem(index, "is_new_medicine", false)
                            }}
                            className="px-3"
                          >
                            Search
                          </Button>
                        </>
                      )}
                    </div>

                    {item.is_new_medicine && (
                      <>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                              value={item.category}
                              onValueChange={(value) => updateItem(index, "category", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TDSR">TDSR</SelectItem>
                                <SelectItem value="PDSR">PDSR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Location (Optional)</Label>
                            <Input
                              value={item.location || ""}
                              onChange={(e) => updateItem(index, "location", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <Label>Stock Book Page Number</Label>
                          <Input
                            value={item.stock_book_page_number || ""}
                            onChange={(e) => updateItem(index, "stock_book_page_number", e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`batch-number-${index}`}>Batch Number</Label>
                    <Input
                      id={`batch-number-${index}`}
                      value={item.batch_number}
                      onChange={(e) => updateItem(index, "batch_number", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={item.expiry_date ? format(item.expiry_date, "yyyy-MM-dd") : ""}
                      onChange={(e) => updateItem(index, "expiry_date", e.target.value ? new Date(e.target.value) : null)}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        value={item.quantity === null ? "" : item.quantity}
                        onChange={(e) => {
                          const value = e.target.value
                          const qty = value === "" ? null : parseFloat(value)
                          const updates: Partial<PurchaseItem> = { quantity: qty }
                          
                          // Only calculate unit price if both values exist
                          if (item.total_price && qty) {
                            updates.unit_price = item.total_price / qty
                          } else {
                            updates.unit_price = null
                          }
                          
                          // Update all changed fields at once
                          setItems(items.map((i, idx) => 
                            idx === index ? { ...i, ...updates } : i
                          ))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Price</Label>
                      <Input
                        type="number"
                        placeholder="Enter total price"
                        value={item.total_price === null ? "" : item.total_price}
                        onChange={(e) => {
                          const value = e.target.value
                          const total = value === "" ? null : parseFloat(value)
                          const updates: Partial<PurchaseItem> = { total_price: total }
                          
                          // Only calculate unit price if both values exist
                          if (item.quantity && total) {
                            updates.unit_price = total / item.quantity
                          } else {
                            updates.unit_price = null
                          }
                          
                          // Update all changed fields at once
                          setItems(items.map((i, idx) => 
                            idx === index ? { ...i, ...updates } : i
                          ))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price (Auto)</Label>
                      <Input
                        type="number"
                        value={item.unit_price === null ? "" : item.unit_price.toFixed(2)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Purchase"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
