"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Define the step data structure
interface Step {
  id: number
  icon: string
  title: string
  description: string
}

// All steps from the three slides
const allSteps: Step[] = [
  {
    id: 1,
    icon: "⋮",
    title: "List your accommodation",
    description:
      "Our platform walks you through the process of listing your accommodation, breaking it down into simple steps. You'll be prompted to enter property details, including location, amenities, and rental terms, as well as upload high-quality images that showcase your property.",
  },
  {
    id: 2,
    icon: "⋯",
    title: "We verify and approve it",
    description:
      "After you submit your listing, our team conducts a thorough review to ensure all information is complete, accurate, and meets our quality standards. We'll check for things like proper descriptions, valid images, and adherence to our guidelines.",
  },
  {
    id: 3,
    icon: "⋰",
    title: "Student makes a booking",
    description:
      "Once your listing is live, students can start booking your accommodation. You'll receive instant notifications via email whenever a booking is made, allowing you to act quickly.",
  },
  {
    id: 4,
    icon: "⋱",
    title: "Accept or reject booking",
    description:
      "Bookings include information such as the specific room type chosen and the student details such as their name, university, age, gender, and funding. You can then make an informed decision about whether to accept or reject the booking.",
  },
  {
    id: 5,
    icon: "⋮⋮",
    title: "Exchange contact details",
    description:
      "Upon acceptance of a booking, both you and the student will gain access to each other's contact details for arranging move-in dates or addressing any questions you or the student might have.",
  },
]

// Group steps into slides (3 steps per slide)
const slides = [
  [allSteps[0], allSteps[1], allSteps[2]], // Slide 1
  [allSteps[1], allSteps[2], allSteps[3]], // Slide 2
  [allSteps[2], allSteps[3], allSteps[4]], // Slide 3
]

export default function HowItWorks() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <section className="py-16 px-4 md:px-8 lg:px-12 max-w-9xl mx-auto">
      {/* Section Title */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800">How it works</h2>
        <div className="w-16 h-1 bg-[#00acee] mx-auto mt-2"></div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {slides[currentSlide].map((step, index) => (
          <div key={index} className="bg-[#00acee]/10 rounded-3xl p-8 relative">
            {/* Blue accent line */}
            <div className="absolute left-0 top-8 bottom-8 w-1.5 bg-[#00acee] rounded-r-full"></div>

            {/* Icon */}
            <div className="border border-[#00acee] text-[#00acee] w-10 h-10 flex items-center justify-center rounded mb-6 ml-4">
              <span className="text-xl">{step.icon}</span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-slate-800 text-lg mb-3">{step.title}</h3>

            {/* Description */}
            <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-center items-center mt-8 gap-2">
        {/* Dots */}
        <div className="flex gap-2 mx-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                currentSlide === index ? "bg-[#00acee] w-6" : "bg-gray-300",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Arrow Buttons */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={goToPrevSlide}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00acee] hover:text-[#00acee] transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextSlide}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00acee] hover:text-[#00acee] transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
