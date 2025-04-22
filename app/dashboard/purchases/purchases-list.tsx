"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Eye, Trash2 } from "lucide-react"
import { ViewPurchaseDialog } from '@/app/dashboard/purchases/view-purchase-dialog'
import { useToast } from "@/components/ui/use-toast"

interface Purchase {
  id: string
  invoice_number: string
  supplier_name: string
  purchase_date: string
  total_amount: number
  payment_status: 'paid' | 'pending'
  created_at: string
  transferred_to_inventory?: boolean
}

interface PurchasesListProps {
  onStatusUpdate?: () => void
}

export function PurchasesList({ onStatusUpdate }: PurchasesListProps) {
  const { toast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPurchases()
  }, [onStatusUpdate])

  const fetchPurchases = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error("Error fetching purchases:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20"

        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
      default:
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
    }
  }

  const handleDelete = async (purchase: Purchase) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return

    try {
      setDeleting(true)
      const supabase = createClient()

      // First delete all purchase items
      const { error: itemsError } = await supabase
        .from("purchase_items")
        .delete()
        .eq("purchase_id", purchase.id)

      if (itemsError) throw itemsError

      // Then delete the purchase
      const { error: purchaseError } = await supabase
        .from("purchases")
        .delete()
        .eq("id", purchase.id)

      if (purchaseError) throw purchaseError

      toast({
        title: "Purchase deleted",
        description: "The purchase has been successfully deleted."
      })
      fetchPurchases()
      onStatusUpdate?.()
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete purchase"
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>{purchase.invoice_number}</TableCell>
                <TableCell>{purchase.supplier_name}</TableCell>
                <TableCell>{format(new Date(purchase.purchase_date), "PPP")}</TableCell>
                <TableCell>₹{purchase.total_amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(purchase.payment_status)}>
                    {purchase.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {purchase.payment_status === 'paid' && (
                    <Badge
                      variant="outline"
                      className={purchase.transferred_to_inventory ? 
                        'bg-green-500/10 text-green-500' : 
                        'bg-yellow-500/10 text-yellow-500'
                      }
                    >
                      {purchase.transferred_to_inventory ? 'Transferred' : 'Not Transferred'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedPurchase(purchase.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(purchase)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No purchases found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ViewPurchaseDialog
        purchaseId={selectedPurchase}
        open={!!selectedPurchase}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedPurchase(null)
            fetchPurchases()
          }
        }}
        onStatusUpdate={() => {
          fetchPurchases()
          onStatusUpdate?.()
        }}
      />
    </>
  )
}
