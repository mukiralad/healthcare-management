"use client"

import { Suspense, use } from 'react'
import { PatientPageClient } from './patient-page-client'

type PageParams = {
  id: string;
}

export default function PatientPage({ params }: { params: PageParams }) {
  const resolvedParams = use(params as any) as PageParams;
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <PatientPageClient id={resolvedParams.id} />
    </Suspense>
  )
}

