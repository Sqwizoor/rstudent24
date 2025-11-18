"use client";

import React from "react";
import FooterSection from "@/app/(nondashboard)/landing/FooterSection";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Terms and Conditions</h1>
          <p className="text-blue-100">
            Last updated: June 3, 2025
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto py-12 px-4 bg-white shadow-sm my-8 rounded-lg">
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">1. Definitions</h2>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li><strong>&quot;Student&quot;</strong> refers to any person using the platform to seek accommodation.</li>
            <li><strong>&quot;Landlord&quot;</strong> refers to any individual or entity listing accommodation on the platform.</li>
            <li><strong>&quot;Tenant&quot;</strong> refers to a student whose application is accepted by a landlord.</li>
            <li><strong>&quot;Platform&quot;</strong> refers to the Rental App website.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">2. User Registration and Application Process</h2>
          
          <h3 className="text-xl font-semibold text-slate-700 mb-4">2.1. Student Information</h3>
          <p className="mb-4">When submitting an application, tenants are required to provide the following details:</p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Full Name</li>
            <li>Contact details including mobile number and email</li>
            <li>University or College and Status</li>
            <li>Funding Source and Status</li>
            <li>Gender</li>
            <li>Age</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">2.2. Landlord Selection</h3>
          <p className="mb-4">Landlords are granted the discretion to accept or decline tenant applications based on the provided details.</p>
          <p className="mb-6">Once a tenant&apos;s application is accepted, the tenant&apos;s contact details, including their mobile number and email address, will be shared with the landlord.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">3. Landlord Responsibilities</h2>
          
          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.1. Accurate Listings</h3>
          <p className="mb-2">Landlords must provide accurate and up-to-date information about their accommodation.</p>
          <p className="mb-2">This includes truthful details about location, rent, property conditions, and any relevant terms or conditions.</p>
          <p className="mb-4">Misleading or false information may result in suspension from the platform.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.2. Proof of Identity or Registration</h3>
          <p className="mb-2">Landlords are required to provide proof of company registration or valid identification.</p>
          <p className="mb-4">This will be linked to their profile to prevent fraudulent activities or identity theft.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.3. Listing Resources</h3>
          <p className="mb-2">Landlords are provided with resources to list accommodation.</p>
          <p className="mb-2">This includes tools to manage listings, review tenant applications, and accept or decline tenants based on the provided information.</p>
          <p className="mb-4">It is the landlord&apos;s responsibility to maintain accurate and up-to-date information on their listings.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.4. Compliance with Legal Requirements</h3>
          <p className="mb-2">Landlords must ensure compliance with South African property laws, including providing safe, lawful, and habitable accommodation in line with the Rental Housing Act 50 of 1999.</p>
          <p className="mb-4">Any lease agreements must adhere to applicable laws.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.5. Respectful Communication</h3>
          <p className="mb-2">Landlords must treat all potential tenants with respect and fairness, regardless of race, gender, nationality, religion, or background.</p>
          <p className="mb-4">Any form of discrimination or harassment will not be tolerated and may lead to account suspension.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.6. Timely Response to Applications</h3>
          <p className="mb-2">Landlords must review tenant applications and respond in a timely and professional manner.</p>
          <p className="mb-2">Unanswered applications will expire after 48hrs.</p>
          <p className="mb-4">Once a tenant is accepted, landlords are responsible for ensuring communication is clear and consistent regarding lease agreements, payments, and any other terms.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.7. Resolution of Disputes</h3>
          <p className="mb-2">While Rental App facilitates connections, landlords are responsible for resolving any disputes that arise with tenants regarding the lease or the accommodation itself.</p>
          <p className="mb-6">Legal agreements and procedures should be followed.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">4. Responsibilities of the Student</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.1. Accurate Information</h3>
          <p className="mb-2">Students must provide truthful and accurate information when applying for accommodation.</p>
          <p className="mb-2">This includes their name, university/college status, funding status, and other required details.</p>
          <p className="mb-4">Any falsified information may result in removal from the platform.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.2. Respectful Communication</h3>
          <p className="mb-2">Students are expected to engage with landlords and other platform users in a respectful and professional manner.</p>
          <p className="mb-4">Any form of harassment, abusive behavior, or disrespectful conduct is strictly prohibited.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.3. Lease and Payment Obligations</h3>
          <p className="mb-4">Once a lease agreement is signed with the landlord, students are responsible for adhering to its terms, including payment schedules, property rules, and conditions of residence.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.4. Timely Communication</h3>
          <p className="mb-2">Students must promptly respond to landlord communications, especially after their application has been accepted.</p>
          <p className="mb-4">Clear communication regarding lease agreements, payments, and moving arrangements is essential.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.5. Resolution of Disputes</h3>
          <p className="mb-4">In the event of a dispute with the landlord, students are encouraged to resolve matters amicably and legally. Rental App is not responsible for intervening in such disputes.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">5. Rental App&apos;s Role as a Platform Provider</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.1. Platform for Advertising and Connection</h3>
          <p className="mb-2">Rental App solely provides a platform for landlords to advertise their accommodation and for students to connect with landlords.</p>
          <p className="mb-4">We do not own, manage, or control the properties listed on our site.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.2. Limitation of Liability</h3>
          <p className="mb-2">Rental App is not liable for any disputes, issues, or content posted by users (landlords or students) on the platform.</p>
          <p className="mb-4">However, we reserve the right to remove any content that violates the law or the platform&apos;s terms of service.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.3. Legal Compliance and Brand Protection</h3>
          <p className="mb-2">While we are not responsible for the actions of users, we are committed to acting legally and protecting our brand.</p>
          <p className="mb-4">Any intentional act of posting harmful or misleading content, or misuse of the platform that harms the reputation of Rental App, will result in legal action or removal from the platform.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.4. Respect and Professional Conduct</h3>
          <p className="mb-2">All users of the platform, including both students and landlords, are required to conduct themselves with respect and professionalism.</p>
          <p className="mb-4">Any violation of this expectation may result in account suspension or removal from Rental App.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.5. Use of Contact Information for Verification</h3>
          <p className="mb-2">To ensure the integrity of our service, Rental App may contact students to verify whether they have moved into the accommodation they applied for.</p>
          <p className="mb-2">This may be done through phone calls, emails, or WhatsApp.</p>
          <p className="mb-6">The information collected will help us make any necessary claims, such as commission payments from landlords, and ensure the accuracy of our service.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">6. Fees and Payment</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">6.1. Service Fees</h3>
          <p className="mb-2">Rental App charges a service fee of 1.37% of the monthly rental per successful or moved-in student.</p>
          <p className="mb-4">This fee is applicable until termination of rental agreement between tenants and landlords.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">6.2. Penalty for Missed Payments</h3>
          <p className="mb-6">In the event that the landlord misses a payment 7 days after an invoice has been issued without a valid, supporting reason, a fixed penalty of R200 (Two-hundred Rands) will be added on each missed invoice.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">7. Data Protection and Privacy</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">7.1. Compliance with POPIA</h3>
          <p className="mb-2">Rental App is committed to safeguarding personal information in compliance with the Protection of Personal Information Act (POPIA).</p>
          <p className="mb-4">Any personal information collected through the platform will only be used for the purposes of connecting tenants and landlords and will not be shared with any third parties without prior consent.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">7.2. Data Sharing</h3>
          <p className="mb-6">Only after the landlord accepts a tenant&apos;s application will the tenant&apos;s contact details, including mobile number and email address, be shared with the landlord.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">8. Termination of Service</h2>
          <p className="mb-6">Rental App reserves the right to terminate or suspend any account or listing at its discretion if it deems the actions of a user to be in violation of these terms and conditions, unlawful, or harmful to the platform&apos;s integrity or other users.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">9. Dispute Resolution</h2>
          <p className="mb-2">In the event of any disputes between landlords and tenants, Rental App encourages both parties to resolve matters amicably.</p>
          <p className="mb-2">Rental App is not responsible for any disputes that arise after contact details have been exchanged and a lease agreement has been entered into.</p>
          <p className="mb-6">Should formal legal proceedings be necessary, disputes must be resolved under South African law.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">10. Amendments to the Terms</h2>
          <p className="mb-6">Rental App reserves the right to update or modify these terms and conditions at any time without prior notice. Users are encouraged to regularly review the terms to ensure awareness of any changes.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">11. Governing Law</h2>
          <p className="mb-6">These terms and conditions are governed by and construed in accordance with the laws of South Africa. Any disputes arising from or relating to these terms shall be subject to the exclusive jurisdiction of the South African courts.</p>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
