import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

interface PatientDetailsProps {
  patient: {
    id: string
    name: string
    gender: string
    age: number
    id_number: string
    phone_number: string
    email?: string
    role: string
    created_at: string
  }
}

export function PatientDetails({ patient }: PatientDetailsProps) {
  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Name</TableCell>
          <TableCell>{patient.name}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Gender</TableCell>
          <TableCell>{patient.gender}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Age</TableCell>
          <TableCell>{patient.age} years</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">ID Number</TableCell>
          <TableCell>{patient.id_number}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Phone Number</TableCell>
          <TableCell>{patient.phone_number}</TableCell>
        </TableRow>
        {patient.email && (
          <TableRow>
            <TableCell className="font-medium">Email</TableCell>
            <TableCell>{patient.email}</TableCell>
          </TableRow>
        )}
        <TableRow>
          <TableCell className="font-medium">Role</TableCell>
          <TableCell>{patient.role}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Registered On</TableCell>
          <TableCell>{new Date(patient.created_at).toLocaleDateString()}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

