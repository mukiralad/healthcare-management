"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Plus, Receipt } from "lucide-react"
import { NewPurchaseDialog } from "./new-purchase-dialog"
import { PurchasesList } from "./purchases-list"
import { useToast } from "@/components/ui/use-toast"

export function PurchasesClient() {
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false)
  const [totalPurchases, setTotalPurchases] = useState(0)
  const { toast } = useToast()

  const updateTotalPurchases = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('purchases')
      .select('total_amount')
      .eq('payment_status', 'paid')
    
    const total = data?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0
    setTotalPurchases(total)
  }

  useEffect(() => {
    updateTotalPurchases()
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchases.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-medium">Recent Purchases</h3>
          <p className="text-sm text-muted-foreground">
            Manage and view purchase history
          </p>
        </div>
        <Button onClick={() => setIsNewPurchaseOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Purchase
        </Button>
      </div>

      <PurchasesList onStatusUpdate={updateTotalPurchases} />

      <NewPurchaseDialog 
        open={isNewPurchaseOpen} 
        onOpenChange={setIsNewPurchaseOpen}
        onSuccess={() => {
          setIsNewPurchaseOpen(false)
          toast({
            title: "Purchase created",
            description: "The purchase has been successfully recorded.",
          })
        }}
      />
    </div>
  )
}
