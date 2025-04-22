"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DialogDescription } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface PurchaseItem {
  id?: string
  medicine_name: string
  batch_number: string
  expiry_date: string
  quantity: number
  unit_price: number
  total_price: number
  purchase_id?: string
}

interface Purchase {
  id: string
  invoice_number: string
  supplier_name: string
  purchase_date: string
  total_amount: number
  payment_status: string
  paid_amount: number
  notes: string
  created_at: string
  items?: PurchaseItem[]
  transferred_to_inventory?: boolean
}

interface ViewPurchaseDialogProps {
  purchaseId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdate?: () => void
  onTransferSuccess?: () => void
}

export function ViewPurchaseDialog({ purchaseId, open, onOpenChange, onStatusUpdate }: ViewPurchaseDialogProps) {
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [newItem, setNewItem] = useState<PurchaseItem>({
    medicine_name: '',
    batch_number: '',
    expiry_date: new Date().toISOString().split('T')[0],
    quantity: 0,
    unit_price: 0,
    total_price: 0
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPurchase, setEditedPurchase] = useState<Purchase | null>(null)
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [isTransferring, setIsTransferring] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (purchaseId && open) {
      fetchPurchaseDetails()
    }
  }, [purchaseId, open])

  useEffect(() => {
    if (purchase) {
      setEditedPurchase({
        ...purchase,
        items: items // Ensure items are included in editedPurchase
      })
      setPaidAmount(purchase.paid_amount || 0)
      // Ensure payment status is correct based on paid amount
      const status = !purchase.paid_amount ? 'pending' : 
                    purchase.paid_amount === purchase.total_amount ? 'paid' : 'pending'
      if (status !== purchase.payment_status) {
        setPurchase(prev => prev ? { ...prev, payment_status: status } : null)
      }
    }
  }, [purchase])

  const fetchPurchaseDetails = async () => {
    if (!purchaseId) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch purchase details
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .select("*")
        .eq("id", purchaseId)
        .single()

      if (purchaseError) throw purchaseError

      // Fetch purchase items
      const { data: itemsData, error: itemsError } = await supabase
        .from("purchase_items")
        .select("*")
        .eq("purchase_id", purchaseId)

      if (itemsError) throw itemsError

      setPurchase(purchaseData)
      setItems(itemsData || [])
    } catch (error) {
      console.error("Error fetching purchase details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load purchase details",
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (status: string) => {
    if (!purchase) return

    try {
      setUpdating(true)
      const supabase = createClient()

      const { error } = await supabase
        .from("purchases")
        .update({ payment_status: status })
        .eq("id", purchase.id)

      if (error) throw error

      setPurchase({ ...purchase, payment_status: status })
      onStatusUpdate?.() // Call the callback to update total purchases
      toast({
        title: "Status updated",
        description: `Payment status has been updated to ${status}.`
      })
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment status",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!purchase || !purchaseId) return

    try {
      setUpdating(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('purchases')
        .update({ 
          payment_status: newStatus,
          paid_amount: newStatus === 'paid' ? purchase.total_amount : 0
        })
        .eq('id', purchaseId)

      if (error) throw error

      setPurchase(prev => prev ? {
        ...prev,
        payment_status: newStatus,
        paid_amount: newStatus === 'paid' ? prev.total_amount : 0
      } : null)

      toast({
        title: "Status updated",
        description: `Payment status has been updated to ${newStatus}.`
      })

      onStatusUpdate?.()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error updating status",
        description: "There was a problem updating the payment status.",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const [showTransferDialog, setShowTransferDialog] = useState(false)

  const handleTransferToInventory = async () => {
    if (!purchase || !items.length) return

    try {
      setIsTransferring(true)
      const supabase = createClient()

      // Transfer each item to master inventory
      for (const item of items) {
        // Check if medicine exists in master inventory
        const { data: existingMedicine } = await supabase
          .from('master_inventory')
          .select('*')
          .eq('medicine_name', item.medicine_name)
          .single()

        if (existingMedicine) {
          // Update existing medicine quantity
          await supabase
            .from('master_inventory')
            .update({ 
              quantity: existingMedicine.quantity + item.quantity 
            })
            .eq('medicine_name', item.medicine_name)
        } else {
          // Add new medicine to inventory
          await supabase
            .from('master_inventory')
            .insert({
              medicine_name: item.medicine_name,
              quantity: item.quantity,
              category: 'TDSR', // Default category
              stock_book_page_number: purchase.invoice_number // Using invoice number as reference
            })
        }
      }

      // Update purchase status to transferred
      await supabase
        .from('purchases')
        .update({ transferred_to_inventory: true })
        .eq('id', purchase.id)

      setPurchase(prev => prev ? {
        ...prev,
        transferred_to_inventory: true
      } : null)

      toast({
        title: "Transfer successful",
        description: "All items have been transferred to master inventory."
      })

    } catch (error) {
      console.error('Error transferring to inventory:', error)
      toast({
        title: "Transfer failed",
        description: "There was a problem transferring items to inventory.",
        variant: "destructive"
      })
    } finally {
      setIsTransferring(false)
    }
  }

  const addItem = async () => {
    if (!purchase) return

    try {
      setUpdating(true)
      const supabase = createClient()

      // Calculate total price
      const totalPrice = newItem.quantity * newItem.unit_price

      // Insert new item
      const { data, error } = await supabase
        .from('purchase_items')
        .insert([{
          ...newItem,
          purchase_id: purchase.id,
          total_price: totalPrice
        }])
        .select()

      if (error) throw error

      // Update purchase total amount
      const newTotalAmount = purchase.total_amount + totalPrice
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ total_amount: newTotalAmount })
        .eq('id', purchase.id)

      if (updateError) throw updateError

      // Update local state
      setItems([...items, data[0]])
      setPurchase({ ...purchase, total_amount: newTotalAmount })
      
      // Reset new item form
      setNewItem({
        medicine_name: '',
        batch_number: '',
        expiry_date: new Date().toISOString().split('T')[0],
        quantity: 0,
        unit_price: 0,
        total_price: 0
      })

      toast({
        title: 'Success',
        description: 'Item added successfully'
      })
    } catch (error) {
      console.error('Error adding item:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add item'
      })
    } finally {
      setUpdating(false)
    }
  }

  const deleteItem = async (itemId: string, itemTotal: number) => {
    if (!purchase) return

    try {
      setUpdating(true)
      const supabase = createClient()

      // Delete item
      const { error } = await supabase
        .from('purchase_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      // Update purchase total amount
      const newTotalAmount = purchase.total_amount - itemTotal
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ total_amount: newTotalAmount })
        .eq('id', purchase.id)

      if (updateError) throw updateError

      // Update local state
      setItems(items.filter(item => item.id !== itemId))
      setPurchase({ ...purchase, total_amount: newTotalAmount })

      toast({
        title: 'Success',
        description: 'Item deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete item'
      })
    } finally {
      setUpdating(false)
    }
  }

  const updatePaidAmount = async (amount: number) => {
    if (!purchase) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Purchase details not found"
      })
      return
    }

    // Validate and clamp amount
    const validAmount = Math.min(Math.max(amount, 0), purchase.total_amount)

    try {
      setUpdating(true)
      const supabase = createClient()

      // Update both paid_amount and payment_status
      const { error } = await supabase
        .from("purchases")
        .update({
          paid_amount: validAmount,
          payment_status: validAmount === 0 ? 'pending' : 'paid'
        })
        .eq("id", purchase.id)

      if (error) {
        throw new Error(error.message)
      }

      setPurchase({
        ...purchase,
        paid_amount: validAmount,
        payment_status: validAmount === 0 ? 'pending' : 'paid'
      })
      
      onStatusUpdate?.() // Call the callback to update total purchases
      
      toast({
        title: "Payment updated",
        description: `Paid amount updated to ₹${amount.toFixed(2)}`
      })
    } catch (error) {
      console.error("Error updating paid amount:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update paid amount"
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleSave = async () => {
    if (!purchase || !editedPurchase) return

    try {
      setUpdating(true)
      const supabase = createClient()

      // Update main purchase details
      const { error: purchaseError } = await supabase
        .from("purchases")
        .update({
          invoice_number: editedPurchase.invoice_number,
          supplier_name: editedPurchase.supplier_name,
          purchase_date: editedPurchase.purchase_date,
          notes: editedPurchase.notes,
          total_amount: editedPurchase.total_amount,
          payment_status: editedPurchase.payment_status,
          paid_amount: editedPurchase.paid_amount
        })
        .eq("id", purchase.id)

      if (purchaseError) throw purchaseError

      // Update each item
      if (editedPurchase.items) {
        for (const item of editedPurchase.items) {
          const { error: itemError } = await supabase
            .from("purchase_items")
            .update({
              medicine_name: item.medicine_name,
              batch_number: item.batch_number,
              expiry_date: item.expiry_date,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price
            })
            .eq("id", item.id)

          if (itemError) throw itemError
        }
      }

      setPurchase(editedPurchase)
      setItems(editedPurchase.items || [])
      setIsEditing(false)
      onStatusUpdate?.() // Call callback to update total purchases
      toast({
        title: "Purchase updated",
        description: "Purchase details and items have been updated successfully."
      })
    } catch (error) {
      console.error("Error updating purchase:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update purchase details"
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!purchase || !confirm('Are you sure you want to delete this purchase?')) return

    try {
      setUpdating(true)
      const supabase = createClient()

      const { error } = await supabase
        .from("purchases")
        .delete()
        .eq("id", purchase.id)

      if (error) throw error

      toast({
        title: "Purchase deleted",
        description: "The purchase has been successfully deleted."
      })
      onOpenChange(false)
      onStatusUpdate?.()
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete purchase"
      })
    } finally {
      setUpdating(false)
    }
  }

  if (!purchase || loading) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="absolute right-4 top-4">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle>Purchase Details</DialogTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSave}
                  disabled={updating}
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsEditing(false)
                    setEditedPurchase(purchase)
                  }}
                  disabled={updating}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  disabled={updating}
                >
                  Edit
                </Button>
                {purchase?.payment_status === 'paid' && !purchase?.transferred_to_inventory && (
                  <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                    <AlertDialogTrigger asChild>
                      <Button disabled={isTransferring}>
                        Transfer to Inventory
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Transfer to Master Inventory</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to transfer all items to master inventory? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleTransferToInventory}
                          disabled={isTransferring}
                        >
                          {isTransferring ? "Transferring..." : "Transfer"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
              {isEditing ? (
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={editedPurchase?.invoice_number}
                  onChange={(e) => setEditedPurchase(prev => prev ? {...prev, invoice_number: e.target.value} : null)}
                />
              ) : (
                <p className="text-lg">{purchase.invoice_number}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Supplier</p>
              {isEditing ? (
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={editedPurchase?.supplier_name}
                  onChange={(e) => setEditedPurchase(prev => prev ? {...prev, supplier_name: e.target.value} : null)}
                />
              ) : (
                <p className="text-lg">{purchase.supplier_name}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
              {isEditing ? (
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={editedPurchase?.purchase_date.split('T')[0]}
                  onChange={(e) => setEditedPurchase(prev => prev ? {...prev, purchase_date: e.target.value} : null)}
                />
              ) : (
                <p className="text-lg">{format(new Date(purchase.purchase_date), "PPP")}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              {isEditing ? (
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  value={editedPurchase?.total_amount}
                  onChange={(e) => setEditedPurchase(prev => prev ? {...prev, total_amount: parseFloat(e.target.value) || 0} : null)}
                  min="0"
                  step="0.01"
                />
              ) : (
                <p className="text-lg">₹{purchase.total_amount.toFixed(2)}</p>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                <div className="flex flex-col space-y-2">
                  <Select 
                    value={purchase.payment_status}
                    onValueChange={handleStatusUpdate}
                    disabled={updating || isTransferring}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                {isEditing ? (
                  <textarea
                    className="w-full p-2 border rounded-md"
                    value={editedPurchase?.notes || ''}
                    onChange={(e) => setEditedPurchase(prev => prev ? {...prev, notes: e.target.value} : null)}
                    rows={3}
                  />
                ) : (
                  purchase.notes && <p className="text-base">{purchase.notes}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">Items</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch No.</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {isEditing ? (
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={editedPurchase?.items?.[index]?.medicine_name ?? item.medicine_name}
                            onChange={(e) => {
                              const newItems = [...(editedPurchase?.items || items)]
                              newItems[index] = { ...newItems[index], medicine_name: e.target.value }
                              setEditedPurchase(prev => prev ? { ...prev, items: newItems } : null)
                            }}
                          />
                        ) : (
                          item.medicine_name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={editedPurchase?.items?.[index]?.batch_number ?? item.batch_number}
                            onChange={(e) => {
                              const newItems = [...(editedPurchase?.items || items)]
                              newItems[index] = { ...newItems[index], batch_number: e.target.value }
                              setEditedPurchase(prev => prev ? { ...prev, items: newItems } : null)
                            }}
                          />
                        ) : (
                          item.batch_number
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            type="date"
                            className="w-full p-2 border rounded-md"
                            value={editedPurchase?.items?.[index]?.expiry_date ?? item.expiry_date}
                            onChange={(e) => {
                              const newItems = [...(editedPurchase?.items || items)]
                              newItems[index] = { ...newItems[index], expiry_date: e.target.value }
                              setEditedPurchase(prev => prev ? { ...prev, items: newItems } : null)
                            }}
                          />
                        ) : (
                          format(new Date(item.expiry_date), 'dd-MM-yyyy')
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-full p-2 border rounded-md"
                            value={editedPurchase?.items?.[index]?.quantity || item.quantity}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value) || 0
                              const newItems = [...(editedPurchase?.items || items)]
                              newItems[index] = { 
                                ...newItems[index], 
                                quantity: quantity,
                                total_price: quantity * (newItems[index].unit_price || item.unit_price)
                              }
                              const totalAmount = newItems.reduce((sum, item) => sum + item.total_price, 0)
                              setEditedPurchase(prev => prev ? { 
                                ...prev, 
                                items: newItems,
                                total_amount: totalAmount
                              } : null)
                            }}
                            min="0"
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-full p-2 border rounded-md"
                            value={editedPurchase?.items?.[index]?.unit_price || item.unit_price}
                            onChange={(e) => {
                              const price = parseFloat(e.target.value) || 0
                              const newItems = [...(editedPurchase?.items || items)]
                              newItems[index] = { 
                                ...newItems[index], 
                                unit_price: price,
                                total_price: price * (newItems[index].quantity || item.quantity)
                              }
                              const totalAmount = newItems.reduce((sum, item) => sum + item.total_price, 0)
                              setEditedPurchase(prev => prev ? { 
                                ...prev, 
                                items: newItems,
                                total_amount: totalAmount
                              } : null)
                            }}
                            step="0.01"
                          />
                        ) : (
                          `₹${item.unit_price.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>₹{(editedPurchase?.items?.[index]?.total_price || item.total_price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => item.id && deleteItem(item.id, item.total_price)}
                          disabled={updating}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium mb-4">Add New Item</h3>
              <div className="grid grid-cols-6 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Medicine</label>
                  <input
                    type="text"
                    value={newItem.medicine_name}
                    onChange={(e) => setNewItem({ ...newItem, medicine_name: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Medicine name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Batch No.</label>
                  <input
                    type="text"
                    value={newItem.batch_number}
                    onChange={(e) => setNewItem({ ...newItem, batch_number: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Batch no."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Expiry Date</label>
                  <input
                    type="date"
                    value={newItem.expiry_date}
                    onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Quantity</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ 
                      ...newItem, 
                      quantity: parseInt(e.target.value) || 0,
                      total_price: (parseInt(e.target.value) || 0) * newItem.unit_price
                    })}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Unit Price</label>
                  <input
                    type="number"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ 
                      ...newItem, 
                      unit_price: parseFloat(e.target.value) || 0,
                      total_price: newItem.quantity * (parseFloat(e.target.value) || 0)
                    })}
                    className="w-full p-2 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Total</label>
                  <div className="p-2 border rounded bg-background">₹{newItem.total_price}</div>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={addItem}
                  disabled={updating || !newItem.medicine_name || !newItem.batch_number || newItem.quantity <= 0 || newItem.unit_price <= 0}
                >
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
