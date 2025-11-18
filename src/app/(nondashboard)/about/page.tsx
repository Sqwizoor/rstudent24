"use client";

import type { Metadata } from "next";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Mail, Phone, Clock, Users, Home, Shield, Award } from "lucide-react";
import FooterSection from "../landing/FooterSection";

// Note: Metadata export cannot be used in client components
// This metadata will be inherited from the layout
// For static metadata at page level, convert this to a server component

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gray-100 py-10 md:py-10">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <div className="text-[#00acee] text-sm font-medium mb-4">Welcome to Student24</div>
              <h1 className="text-4xl md:text-6xl font-bold text-[#004d71] mb-6">About us</h1>
              <p className="text-lg text-gray-600 max-w-lg">
                The ultimate platform for connecting students with landlords.
              </p>
            </div>
            <div className="md:w-1/2 flex justify-end">
              <div className="relative">
                <Image
                  src="/about/bb.png"
                  alt="Students searching for accommodation"
                  width={550}
                  height={400}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

     

      {/* Bridging the gap section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Image
                src="/about/about-u.png"
                alt="Students walking together"
                width={400}
                height={200}
                className="rounded-xl object-cover w-full"
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center text-[#00acee] mb-4">
                <div className="h-px bg-[#00acee] w-16 mr-4"></div>
                <p className="text-sm font-medium">Bridging the gap between</p>
              </div>
              <h2 className="text-4xl font-bold mb-6 text-gray-800">Students & landlords</h2>
              <p className="text-gray-600 mb-8">
                At Student24, we are dedicated to bridging the gap between student accommodation demand and availability by collaborating with investors. This commitment ensures that students have access to a diverse range of housing options, giving them the freedom to choose the perfect place to stay.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#00acee] text-white rounded-full text-sm font-medium hover:bg-[#0088cc] transition-colors"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our vision, innovation, support */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Vision card */}
            <div className="bg-[#f0f9ff] p-8 rounded-xl">
              <div className="text-[#00acee] mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8.5V15.5M18 8.5H11M18 8.5L12 15.5M6 15.5V8.5M6 15.5H13M6 15.5L12 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Our vision</h3>
              <p className="text-gray-600">
                At Student24, we are driven by an unwavering ambition to become the largest student accommodation platform in Africa. We are committed to continuous innovation, pushing the boundaries to solve housing challenges and deliver extraordinary results for both students and landlords.
              </p>
            </div>

            {/* Innovation card */}
            <div className="bg-[#f0f9ff] p-8 rounded-xl">
              <div className="text-[#00acee] mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16.5V17.5M12 6.5V13.5M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C6.75329 21.5 2.5 17.2467 2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Our innovation</h3>
              <p className="text-gray-600">
                We pride ourselves on staying ahead of the curve with cutting-edge technology that helps solve real-world housing problems. Through strategic partnerships, our platform reaches over 1.5 million students and graduates monthly, cementing our leadership in the student accommodation sector.
              </p>
            </div>

            {/* Support card */}
            <div className="bg-[#f0f9ff] p-8 rounded-xl">
              <div className="text-[#00acee] mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 7.5C15.5 9.98528 13.4853 12 11 12C8.51472 12 6.5 9.98528 6.5 7.5C6.5 5.01472 8.51472 3 11 3C13.4853 3 15.5 5.01472 15.5 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11 12C5.5 12 3 15.5 3 19V21H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14.5 21.5L16.5 19.5L18.5 21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16.5 14.5V19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Our support</h3>
              <p className="text-gray-600">
                We empower landlords with the tools and resources they need to overcome market barriers, foster growth, and boost their confidence in investing in the student accommodation sector. Our platform also provides valuable insights through landlord and tenant reviews, helping landlords make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>




 {/* For landlords/students and Join us on our mission section */}
 <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side: Landlords and Students cards */}
            <div className="md:w-1/2 flex flex-col gap-6">
              {/* For landlords */}
              <div className="bg-[#e8ffdc] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between h-full">
                <div className="md:max-w-[60%]">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">For landlords</h2>
                  <p className="text-gray-700 mb-6">
                    We offer landlords an intuitive portal to list their properties, manage bookings, and track interactions with potential tenants.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 rounded-full text-sm font-medium hover:bg-white transition-colors"
                  >
                    Learn more
                  </Link>
                </div>
                <div className="mt-6 md:mt-0">
                  <Image
                    src="/about/l.png"
                    alt="Landlord illustration"
                    width={150}
                    height={150}
                    className="object-contain"
                    unoptimized={true}
                  />
                </div>
              </div>

              {/* For students */}
              <div className="bg-[#fff1dc] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between h-full">
                <div className="md:max-w-[60%]">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">For students</h2>
                  <p className="text-gray-700 mb-6">
                    We provide a simple, user-friendly interface where students can search for accommodation and book their ideal room with ease.
                  </p>
                  <Link
                    href="/search"
                    className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 rounded-full text-sm font-medium hover:bg-white transition-colors"
                  >
                    Find res
                  </Link>
                </div>
                <div className="mt-6 md:mt-0">
                  <Image
                    src="/about/s.png"
                    alt="Student illustration"
                    width={150}
                    height={150}
                    className="object-contain"
                    unoptimized={true}
                  />
                </div>
              </div>
            </div>

            {/* Right side: Join us on our mission */}
            <div className="md:w-1/2 bg-[#f3e8ff] rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Join us on our mission</h2>
                <p className="text-gray-700 mb-6">
                  Whether you are a student searching for the perfect student accommodation or a landlord looking to maximize your property&apos;s potential, Student24 is here to guide you every step of the way.
                </p>
              </div>
              <div className="mt-4">
                <Image
                  src="/about/about-u.png"
                  alt="Group of diverse students"
                  width={500}
                  height={200}
                  className="rounded-xl object-cover w-full"
                  unoptimized={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Our Story */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-[#00acee]">Our Story</h2>
            <p className="text-lg text-gray-600">
              Founded in 2023, Student24 was born out of a personal frustration with the student housing market in South Africa.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-[#00acee] opacity-30"></div>

              {/* Timeline items */}
              <div className="relative z-10">
                {/* Item 1 */}
                <div className="mb-16 flex items-center">
                  <div className="w-1/2 pr-8 text-right">
                    <h3 className="text-xl font-bold text-[#00acee]">The Beginning</h3>
                    <p className="mt-2 text-gray-600">
                      Our founders experienced firsthand the challenges of finding quality student accommodation.
                      They envisioned a platform that would make this process easier and more transparent.
                    </p>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#00acee] border-4 border-white flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div className="w-1/2 pl-8">
                    <div className="text-[#00acee] text-sm">2023</div>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="mb-16 flex items-center">
                  <div className="w-1/2 pr-8 text-right">
                    <div className="text-[#00acee] text-sm">2024</div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#00acee] border-4 border-white flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div className="w-1/2 pl-8">
                    <h3 className="text-xl font-bold text-[#00acee]">Launch & Growth</h3>
                    <p className="mt-2 text-gray-600">
                      We launched our platform in major university cities across South Africa,
                      partnering with trusted property managers and building a community of students.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-center">
                  <div className="w-1/2 pr-8 text-right">
                    <h3 className="text-xl font-bold text-[#00acee]">Today & Beyond</h3>
                    <p className="mt-2 text-gray-600">
                      Today, we&apos;re expanding our services and continuously improving our platform
                      based on feedback from students and property managers across the country.
                    </p>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#00acee] border-4 border-white flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div className="w-1/2 pl-8">
                    <div className="text-[#00acee] text-sm">2025</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

 
    

      {/* Contact section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - image */}
            <div className="md:w-full">
              <Image
                src="/about/conta.png"
                alt="Woman with laptop"
                width={500}
                height={600}
                className="object-cover w-full h-full rounded-xl"
                unoptimized={true}
              />
            </div>

            {/* Right side - contact form */}
            <div className="md:w-full">
              <div className="flex items-center text-[#00acee] mb-2">
                <div className="h-px bg-[#00acee] w-16 mr-4"></div>
                <p className="text-sm font-medium">Contact Student24</p>
              </div>
              <h2 className="text-3xl font-bold mb-3 text-gray-800">Send us a message</h2>
              <p className="text-gray-600 mb-8">
                We are here to help and answer any questions you may have.
              </p>

              <form className="space-y-6">
                <div>
                  <div className="flex items-center text-gray-400 mb-2">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <label htmlFor="name" className="text-sm">Your name please</label>
                  </div>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-[#00acee] focus:border-[#00acee]"
                    placeholder="Name"
                  />
                </div>

                <div>
                  <div className="flex items-center text-gray-400 mb-2">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <label htmlFor="email" className="text-sm">Email address</label>
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-[#00acee] focus:border-[#00acee]"
                    placeholder="alexdubflow2@gmail.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">We will reply to this email</p>
                </div>

                <div>
                  <div className="flex items-center text-gray-400 mb-2">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <label htmlFor="message" className="text-sm">Message</label>
                  </div>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-[#00acee] focus:border-[#00acee]"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#00acee] hover:bg-[#0088cc] text-white font-medium py-3 px-6 rounded-full transition-colors"
                >
                  Send message
                </button>

                <div className="text-center text-sm text-gray-500">
                  Email manually: <span className="text-[#00acee]">info@student24.co</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <FooterSection/>
    </div>
  );
}
