"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface EditTransferDialogProps {
  transfer: {
    id: string
    medicine_name: string
    quantity: number
    from_inventory: string
    to_inventory: string
    issuer: string
    receiver: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransferUpdated: () => void
}

export function EditTransferDialog({
  transfer,
  open,
  onOpenChange,
  onTransferUpdated,
}: EditTransferDialogProps) {
  const supabase = createClient()
  const [quantity, setQuantity] = useState(transfer.quantity.toString())
  const [fromInventory, setFromInventory] = useState(transfer.from_inventory)
  const [toInventory, setToInventory] = useState(transfer.to_inventory)
  const [issuer, setIssuer] = useState(transfer.issuer)
  const [receiver, setReceiver] = useState(transfer.receiver)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const parsedQuantity = parseInt(quantity)
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        throw new Error("Quantity must be a positive number")
      }

      const { error } = await supabase
        .from("transfers")
        .update({
          quantity: parsedQuantity,
          from_inventory: fromInventory,
          to_inventory: toInventory,
          issuer: issuer,
          receiver: receiver,
        })
        .eq("id", transfer.id)

      if (error) throw error

      toast.success("Transfer updated successfully")
      onOpenChange(false)
      onTransferUpdated()
    } catch (error) {
      console.error("Error updating transfer:", error)
      toast.error("Failed to update transfer")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transfer - {transfer.medicine_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromInventory">From Inventory</Label>
            <Input
              id="fromInventory"
              value={fromInventory}
              onChange={(e) => setFromInventory(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toInventory">To Inventory</Label>
            <Input
              id="toInventory"
              value={toInventory}
              onChange={(e) => setToInventory(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer</Label>
            <Input
              id="issuer"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiver">Receiver</Label>
            <Input
              id="receiver"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
