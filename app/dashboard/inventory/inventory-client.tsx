"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { AddMedicineDialog } from "./add-medicine-dialog"
import { TransferMedicineDialog } from "./transfer-medicine-dialog"
import { MedicineTable } from "./medicine-table"

type Medicine = {
  id: string
  medicine_name: string
  quantity: number
  unit: string
  min_stock_level?: number
}

export function InventoryClient() {
  const [masterInventory, setMasterInventory] = useState<Medicine[]>([])
  const [pharmacyInventory, setPharmacyInventory] = useState<Medicine[]>([])
  const [showAddMedicine, setShowAddMedicine] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [activeTab, setActiveTab] = useState("master")
  
  const supabase = createClient()

  const fetchInventory = async () => {
    const { data: masterData } = await supabase
      .from("master_inventory")
      .select("*")
      .order("medicine_name")
    
    const { data: pharmacyData } = await supabase
      .from("pharmacy_inventory")
      .select("*")
      .order("medicine_name")

    setMasterInventory(masterData || [])
    setPharmacyInventory(pharmacyData || [])
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="space-x-2">
          <Button 
            onClick={() => setShowAddMedicine(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </Button>
          {activeTab === "master" && (
            <Button 
              onClick={() => setShowTransfer(true)}
              variant="outline"
            >
              Transfer to Pharmacy
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="master" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="master">Master Inventory</TabsTrigger>
          <TabsTrigger value="pharmacy">Pharmacy Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="master">
          <Card>
            <CardHeader>
              <CardTitle>Master Room Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <MedicineTable 
                medicines={masterInventory}
                showMinStock={false}
                onUpdate={fetchInventory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacy">
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Room Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <MedicineTable 
                medicines={pharmacyInventory}
                showMinStock={true}
                onUpdate={fetchInventory}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddMedicineDialog 
        open={showAddMedicine}
        onOpenChange={setShowAddMedicine}
        onSuccess={fetchInventory}
        inventoryType={activeTab}
      />

      <TransferMedicineDialog
        open={showTransfer}
        onOpenChange={setShowTransfer}
        onSuccess={fetchInventory}
        masterInventory={masterInventory}
      />
    </div>
  )
}
