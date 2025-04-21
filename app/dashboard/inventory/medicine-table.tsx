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
import { Edit2, AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { UpdateMedicineDialog } from "."
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Medicine = {
  id: string
  medicine_name: string
  quantity: number
  min_stock_level?: number
}

type MedicineTableProps = {
  medicines: Medicine[]
  showMinStock: boolean
  onUpdate: () => void
}

export function MedicineTable({ medicines, showMinStock, onUpdate }: MedicineTableProps) {
  const [medicineToUpdate, setMedicineToUpdate] = useState<Medicine | null>(null)
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const supabase = createClient()

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicine Name</TableHead>
            <TableHead>Quantity</TableHead>

            {showMinStock && <TableHead>Min Stock Level</TableHead>}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medicines.map((medicine) => (
            <TableRow key={medicine.id}>
              <TableCell className="align-middle">{medicine.medicine_name}</TableCell>
              <TableCell className="align-middle">
                <div className="flex items-center gap-2">
                  {medicine.quantity}
                  {showMinStock && medicine.quantity <= (medicine.min_stock_level || 0) && (
                    <div title="Low stock">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </div>
                  )}
                </div>
              </TableCell>

              {showMinStock && (
                <TableCell>{medicine.min_stock_level}</TableCell>
              )}
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMedicineToUpdate(medicine)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setMedicineToDelete(medicine)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {medicineToDelete?.medicine_name} from the inventory.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMedicineToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (!medicineToDelete) return
                try {
                  const tableName = showMinStock ? 'pharmacy_inventory' : 'master_inventory'
                  const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .eq('id', medicineToDelete.id)

                  if (error) throw error

                  onUpdate()
                  setShowDeleteDialog(false)
                  setMedicineToDelete(null)
                } catch (error) {
                  console.error('Error deleting medicine:', error)
                }
              }} 
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpdateMedicineDialog
        medicine={medicineToUpdate}
        open={!!medicineToUpdate}
        onOpenChange={(open: boolean) => !open && setMedicineToUpdate(null)}
        onSuccess={onUpdate}
        showMinStock={showMinStock}
      />
    </>
  )
}
