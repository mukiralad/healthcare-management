import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-blue-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary">
                  PJTAU Health Centre Management System
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Streamlined healthcare management for students and staff at Professor Jayashankar Telangana State
                  Agricultural University.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login" passHref>
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Login to System
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[500px] lg:max-w-none flex items-center justify-center">
                <Image
                  src="/TSAU_Logo.png"
                  alt="PJTAU Logo"
                  width={400}
                  height={400}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary">
                  Our Services
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Comprehensive healthcare services for the PJTAU community
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="border-2 border-primary/10 shadow-md">
                <CardContent className="p-6 space-y-2">
                  <CheckCircle className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">General Consultations</h3>
                  <p className="text-gray-500">
                    Regular health check-ups and consultations for all university members.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/10 shadow-md">
                <CardContent className="p-6 space-y-2">
                  <CheckCircle className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Emergency Care</h3>
                  <p className="text-gray-500">Immediate medical attention for emergencies during working hours.</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/10 shadow-md">
                <CardContent className="p-6 space-y-2">
                  <CheckCircle className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Health Education</h3>
                  <p className="text-gray-500">Workshops and resources for maintaining good health and wellness.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full py-6 bg-primary text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <p className="text-sm">© {new Date().getFullYear()} PJTAU Health Centre. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

