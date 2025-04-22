import { Suspense } from "react"
import { PurchasesClient } from "./purchases-client"

export default function PurchasesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Purchases</h2>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <PurchasesClient />
      </Suspense>
    </div>
  )
}
