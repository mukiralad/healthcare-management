"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, User } from "lucide-react"

interface PatientCardProps {
  patient: {
    id: string
    name: string
    gender: string
    age: number
    id_number: string
    phone_number: string
    email?: string
    role: string
  }
  onView: () => void
}

export function PatientCard({ patient, onView }: PatientCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{patient.name}</CardTitle>
            <CardDescription>
              {patient.id_number} • {patient.age} years
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {patient.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Gender:</span>
            <span>{patient.gender}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Phone:</span>
            <span>{patient.phone_number}</span>
          </div>
          {patient.email && (
            <div className="flex items-center gap-2 col-span-2 truncate">
              <span className="font-medium">Email:</span>
              <span className="truncate">{patient.email}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onView}>
          <User className="mr-2 h-4 w-4" />
          View Profile
        </Button>
        <Button variant="outline" size="sm" onClick={onView}>
          <FileText className="mr-2 h-4 w-4" />
          New Visit
        </Button>
      </CardFooter>
    </Card>
  )
}

