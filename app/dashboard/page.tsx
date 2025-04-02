import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientRegistrationForm } from "@/components/patient-registration-form"
import { RecentPatients } from "@/components/recent-patients"
import { UserPlus, Users } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
        <p className="text-muted-foreground">Manage patients and generate review forms for PJTAU Health Centre.</p>
      </div>
      <Tabs defaultValue="register" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
          <TabsTrigger value="register" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Register</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Recent</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Registration</CardTitle>
              <CardDescription>Register a new patient in the PJTAU Health Centre system.</CardDescription>
            </CardHeader>
            <CardContent>
              <PatientRegistrationForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>View and manage recently registered patients.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentPatients />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

