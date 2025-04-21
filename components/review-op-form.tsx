import { useEffect, useState } from "react"
import { formatDateWithTime } from "@/lib/utils"
import Image from "next/image"

interface ReviewOpFormProps {
  patient: {
    id: string
    name: string
    gender: string
    age: number
    id_number: string
    phone_number: string
    email?: string
    role: string
    created_at?: string
  }
  visit?: {
    id: string
    visit_date: string
    doctor_name?: string
    principal_diagnosis?: string
    presenting_complaints?: string
    follow_up_advice?: string
  }
  previousVisit?: {
    id: string
    visit_date: string
    doctor_name?: string
    principal_diagnosis?: string
    presenting_complaints?: string
    follow_up_advice?: string
  } | null
}

export function ReviewOpForm({ patient, visit, previousVisit }: ReviewOpFormProps) {
  const [vitals, setVitals] = useState<any>(null)
  const currentDate = new Date().toISOString()

  useEffect(() => {
    if (visit?.id) {
      const storedVitals = sessionStorage.getItem(`visit_vitals_${visit.id}`)
      if (storedVitals) {
        try {
          setVitals(JSON.parse(storedVitals))
        } catch (error) {
          console.error("Failed to parse vitals from session storage:", error);
          setVitals(null);
        }
      } else {
        setVitals(null);
      }
    } else {
      setVitals(null);
    }
  }, [visit?.id])

  const displayVisitDate = visit?.visit_date || currentDate;

  return (
    <div className="bg-white max-w-[800px] mx-auto shadow-sm print:shadow-none p-8">
      {/* Header */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center">
          <div className="w-16 h-16 mr-4 flex-shrink-0">
            <Image
              src="/TSAU_Logo.png"
              alt="PJTAU Logo"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#0096c7]">PJTAU HEALTH CENTRE</h2>
            <p className="text-sm">Professor Jayashankar Telangana Agricultural University</p>
            <p className="text-sm">Rajendranagar, Hyderabad - 500030</p>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <h3 className="text-lg font-bold">REVIEW OP FORM</h3>
        <p className="text-sm">Date: {formatDateWithTime(displayVisitDate)}</p>
      </div>

      {/* Patient information - Improved Alignment */}
      <div className="mb-6">
        <div className="grid grid-cols-[1fr_auto] gap-x-20">
          {/* Left Column */}
          <div className="space-y-1">
            <div className="flex">
              <div className="w-32 font-medium">Name</div>
              <div>: {patient.name}</div>
            </div>
            <div className="flex">
              <div className="w-32 font-medium">Age</div>
              <div>: {patient.age} years</div>
            </div>
            <div className="flex">
              <div className="w-32 font-medium">Gender</div>
              <div>: {patient.gender}</div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-1">
            <div className="flex">
              <div className="w-32 font-medium">First Reg Date</div>
              <div>: {patient.created_at ? formatDateWithTime(patient.created_at) : "N/A"}</div>
            </div>
            <div className="flex">
              <div className="w-32 font-medium">Prev Cons Date</div>
              <div>: {previousVisit ? formatDateWithTime(previousVisit.visit_date) : "—"}</div>
            </div>
            <div className="flex">
              <div className="w-32 font-medium">Consulting Date</div>
              <div>: {formatDateWithTime(displayVisitDate)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area (Diagnosis, Complaints, Advice, Vitals) */}
      <div className="flex gap-4 mb-4">
        {/* Left side - 70% width */}
        <div className="w-[70%]">
          <div className="mb-6">
            <h4 className="font-bold mb-2">Principal Diagnosis</h4>
            <div className="min-h-[80px]">{visit?.principal_diagnosis || ""}</div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold mb-2">Presenting Complaints (IF ANY)</h4>
            <div className="min-h-[80px]">{visit?.presenting_complaints || ""}</div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold mb-2">Follow-up Advice</h4>
            <div className="min-h-[80px]">{visit?.follow_up_advice || ""}</div>
          </div>
        </div>

        {/* Right side - 30% width for vitals */}
        <div className="w-[30%] border-l pl-4">
          <h4 className="font-bold mb-2">Vitals</h4>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col">
              <p className="font-medium">Temperature</p>
              <p className="min-h-[30px] flex items-center">{vitals?.temperature ?? "—"} °C</p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium">Blood Pressure</p>
              <p className="min-h-[30px] flex items-center">{vitals?.blood_pressure ?? "—"} mmHg</p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium">Pulse Rate</p>
              <p className="min-h-[30px] flex items-center">{vitals?.pulse_rate ?? "—"} bpm</p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium">Respiratory Rate</p>
              <p className="min-h-[30px] flex items-center">{vitals?.respiratory_rate ?? "—"} /min</p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium">O₂ Saturation</p>
              <p className="min-h-[30px] flex items-center">{vitals?.oxygen_saturation ?? "—"} %</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer (Signature, Address) */}
      <div className="mt-8 flex justify-end">
        <div className="text-center">
          <div className="border-t border-black pt-2 min-w-[200px]">
            <p className="font-medium whitespace-nowrap">{visit?.doctor_name}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        <p>PJTAU Health Centre • Rajendranagar, Hyderabad - 500030 • Phone: (040) 24015321</p>
      </div>
    </div>
  )
}