"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, UserPlus, User } from "lucide-react";

// Mock data for development or when database connection fails
const MOCK_PATIENTS = [
  {
    id: "1",
    name: "John Smith",
    age: 22,
    gender: "Male",
    id_number: "S123456",
    phone_number: "9876543210",
    email: "john.smith@pjtsau.edu",
    role: "Student",
    created_at: "2024-04-01T10:00:00Z"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    age: 35,
    gender: "Female",
    id_number: "E789012",
    phone_number: "8765432109",
    email: "sarah.j@pjtsau.edu",
    role: "Permanent Employee",
    created_at: "2024-04-01T09:00:00Z"
  },
  {
    id: "3",
    name: "Rahul Patel",
    age: 45,
    gender: "Male",
    id_number: "R456789",
    phone_number: "7654321098",
    email: "rahul.p@pjtsau.edu",
    role: "Contract Employee",
    created_at: "2024-03-29T14:30:00Z"
  },
  {
    id: "4",
    name: "Priya Singh",
    age: 19,
    gender: "Female",
    id_number: "S654321",
    phone_number: "6543210987",
    email: "priya.s@pjtsau.edu",
    role: "Student",
    created_at: "2024-03-28T11:15:00Z"
  }
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setPatients(data && data.length > 0 ? data : MOCK_PATIENTS);
      } catch (error) {
        console.error("Error fetching patients:", error);
        // Use mock data if database fetch fails
        setPatients(MOCK_PATIENTS);
        toast({
          title: "Notice",
          description: "Using sample patient data. Database connection unavailable.",
          variant: "default",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [supabase, toast]);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      searchTerm === "" ||
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.id_number && patient.id_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.phone_number && patient.phone_number.includes(searchTerm));

    const matchesRole = roleFilter === "" || roleFilter === "all" || patient.role === roleFilter;
    const matchesGender = genderFilter === "" || genderFilter === "all" || patient.gender === genderFilter;

    return matchesSearch && matchesRole && matchesGender;
  });

  const handleViewPatient = (id: string) => {
    // Store patient data in localStorage before navigation to avoid database fetch issues
    const patientToView = patients.find(p => p.id === id);
    if (patientToView) {
      localStorage.setItem('currentPatient', JSON.stringify(patientToView));
    }
    
    router.push(`/dashboard/patient/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Patients</h1>
          <p className="text-muted-foreground">
            Manage and view all registered patients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => router.push("/dashboard?tab=register")}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            New Patient
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name, ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 md:w-[400px]">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Permanent Employee">Permanent Employee</SelectItem>
                  <SelectItem value="Contract Employee">Contract Employee</SelectItem>
                  <SelectItem value="Retired Employee">Retired Employee</SelectItem>
                  <SelectItem value="Dependent">Dependent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-8 w-8 mb-2" />
                        <p>No patients found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.id_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{patient.role}</Badge>
                      </TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>{patient.phone_number}</TableCell>
                      <TableCell>{patient.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPatient(patient.id)}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 