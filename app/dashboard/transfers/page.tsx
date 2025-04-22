"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { EditTransferDialog } from "./edit-transfer-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { useQuery, useQueryClient } from "@tanstack/react-query"

type Transfer = {
  id: string
  medicine_name: string
  quantity: number
  from_inventory: string
  to_inventory: string
  issuer: string
  receiver: string
  transfer_date: string
}

type TransferStats = {
  total_transfers: number
  unique_medicines: number
  total_quantity: number
  medicine_stats: {
    medicine_name: string
    total_transfers: number
    total_quantity: number
    last_transfer: string
  }[]
}

export default function TransfersPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [timeRange, setTimeRange] = useState("all")
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEditTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setIsEditDialogOpen(true)
  }

  const handleDeleteTransfer = async (transferId: string) => {
    try {
      const { error } = await supabase
        .from('transfers')
        .delete()
        .eq('id', transferId)

      if (error) throw error

      // Invalidate and refetch all transfer-related queries
      await queryClient.invalidateQueries({ queryKey: ['transfers'] })
      toast.success('Transfer deleted successfully')
    } catch (error) {
      console.error('Error deleting transfer:', error)
      toast.error('Failed to delete transfer')
    }
  }

  const getTimeRangeFilter = () => {
    const now = new Date()
    switch (timeRange) {
      case "week":
        return new Date(now.setDate(now.getDate() - 7))
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1))
      case "quarter":
        return new Date(now.setMonth(now.getMonth() - 3))
      case "year":
        return new Date(now.setFullYear(now.getFullYear() - 1))
      default:
        return null
    }
  }

  const { data: transferStats } = useQuery<TransferStats>({
    queryKey: ["transfers", "stats", timeRange],
    queryFn: async () => {
      const startDate = getTimeRangeFilter()
      let query = supabase
        .from("transfers")
        .select("*")
        .order("transfer_date", { ascending: false })

      if (startDate) {
        query = query.gte("transfer_date", startDate.toISOString())
      }

      const { data: transfers, error } = await query

      if (error) throw error

      const stats: TransferStats = {
        total_transfers: transfers.length,
        unique_medicines: new Set(transfers.map(t => t.medicine_name)).size,
        total_quantity: transfers.reduce((sum, t) => sum + t.quantity, 0),
        medicine_stats: []
      }

      // Calculate per-medicine statistics
      const medicineMap = new Map()
      transfers.forEach(transfer => {
        const existing = medicineMap.get(transfer.medicine_name) || {
          medicine_name: transfer.medicine_name,
          total_transfers: 0,
          total_quantity: 0,
          last_transfer: transfer.transfer_date
        }
        existing.total_transfers++
        existing.total_quantity += transfer.quantity
        medicineMap.set(transfer.medicine_name, existing)
      })

      stats.medicine_stats = Array.from(medicineMap.values())
      return stats
    }
  })

  const { data: recentTransfers } = useQuery<Transfer[]>({
    queryKey: ["transfers", "recent", timeRange],
    queryFn: async () => {
      const startDate = getTimeRangeFilter()
      let query = supabase
        .from("transfers")
        .select("*")
        .order("transfer_date", { ascending: false })
        .limit(10)

      if (startDate) {
        query = query.gte("transfer_date", startDate.toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Medicine Transfers History</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferStats?.total_transfers ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Medicines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferStats?.unique_medicines ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity Transferred</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferStats?.total_quantity ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medicine-wise Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Total Transfers</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Last Transfer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferStats?.medicine_stats.map((stat: {
                medicine_name: string
                total_transfers: number
                total_quantity: number
                last_transfer: string
              }) => (
                <TableRow key={stat.medicine_name}>
                  <TableCell className="font-medium">{stat.medicine_name}</TableCell>
                  <TableCell>{stat.total_transfers}</TableCell>
                  <TableCell>{stat.total_quantity}</TableCell>
                  <TableCell>{format(new Date(stat.last_transfer), "MMM dd, yyyy, hh:mm a")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Medicine</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Issuer</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransfers?.map((transfer: Transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>{format(new Date(transfer.transfer_date), "MMM dd, yyyy, hh:mm a")}</TableCell>
                  <TableCell className="font-medium">{transfer.medicine_name}</TableCell>
                  <TableCell>{transfer.quantity}</TableCell>
                  <TableCell>{transfer.from_inventory}</TableCell>
                  <TableCell>{transfer.to_inventory}</TableCell>
                  <TableCell>{transfer.issuer}</TableCell>
                  <TableCell>{transfer.receiver}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTransfer(transfer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransfer(transfer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedTransfer && (
        <EditTransferDialog
          transfer={selectedTransfer}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onTransferUpdated={() => {
            refetch()
            setSelectedTransfer(null)
          }}
        />
      )}
    </div>
  )
}
