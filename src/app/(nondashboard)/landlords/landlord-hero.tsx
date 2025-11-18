"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LandlordHero() {
  const router = useRouter()
  return (
  <div className="min-h-[70vh] bg-gradient-to-br from-[#00acee] via-[#00a3e0] to-[#0099d4] relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
        style={{
          backgroundImage: "url('/hero-1.jpg')",
        }}
      />
      
      {/* Dark Overlay */}
  <div className="absolute inset-0 bg-black/40"></div>

     

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Section Label */}
          <div className="flex items-center justify-center mb-8">
            <div className="h-px bg-white w-16"></div>
            <span className="px-4 text-white text-sm font-medium">Are you a landlord?</span>
            <div className="h-px bg-white w-16"></div>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            List your student accommodation.
          </h2>

          {/* Description */}
          <p className="text-white text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect with students searching for quality housing. Our platform makes it easy to create and manage
            listings, find ideal tenants, and ensure your property is always occupied. Create an account now to get
            started.
          </p>

          {/* CTA Button */}
          <Button
            size="lg"
            className="bg-[#00acee] hover:bg-[#0099d4] text-white px-8 py-4 text-lg font-semibold rounded-full border-0 shadow-lg hover:shadow-xl transition-all"
            onClick={() => router.push('/signup')}
          >
            Create an account now
          </Button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <ChevronDown className="w-5 h-5 text-[#00acee]" />
          </div>
        </div>
      </main>
    </div>
  )
}
