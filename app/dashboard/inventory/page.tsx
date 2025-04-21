import { Metadata } from "next"
import { InventoryClient } from "./inventory-client"

export const metadata: Metadata = {
  title: "Inventory Management",
}

export default async function InventoryPage() {
  return <InventoryClient />
}
