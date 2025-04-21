"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { Edit2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { UpdateMedicineDialog } from "./update-medicine-dialog"

type Medicine = {
  id: string
  medicine_name: string
  quantity: number
  unit: string
  min_stock_level?: number
}

type MedicineTableProps = {
  medicines: Medicine[]
  showMinStock: boolean
  onUpdate: () => void
}

export function MedicineTable({ medicines, showMinStock, onUpdate }: MedicineTableProps) {
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicine Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            {showMinStock && <TableHead>Min Stock Level</TableHead>}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medicines.map((medicine) => (
            <TableRow key={medicine.id}>
              <TableCell>{medicine.medicine_name}</TableCell>
              <TableCell className="flex items-center gap-2">
                {medicine.quantity}
                {showMinStock && medicine.quantity <= (medicine.min_stock_level || 0) && (
                  <div title="Low stock">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                )}
              </TableCell>
              <TableCell>{medicine.unit}</TableCell>
              {showMinStock && (
                <TableCell>{medicine.min_stock_level}</TableCell>
              )}
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMedicine(medicine)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UpdateMedicineDialog
        medicine={selectedMedicine}
        open={!!selectedMedicine}
        onOpenChange={(open: boolean) => !open && setSelectedMedicine(null)}
        onSuccess={onUpdate}
        showMinStock={showMinStock}
      />
    </>
  )
}
