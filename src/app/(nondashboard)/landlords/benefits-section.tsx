import Image from "next/image";

export default function BenefitsSection() {
    return (
      <section className="py-16 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Row */}
          <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-3xl p-8 md:p-10">
            <h3 className="text-2xl md:text-3xl font-bold text-orange-900 mb-6 leading-tight">
              Manage your listings with ease on our <span className="font-script italic">comprehensive</span> landlord
              portal.
            </h3>
            <p className="text-orange-800 text-sm leading-relaxed">
              Whether you&apos;re tech-savvy or not, our landlord portal makes it easy for you to create and manage your
              listings. Our intuitive step-by-step creation tool walks you through the entire process, allowing you to add
              all necessary details at your own pace. Need a break? You can save your progress and continue later,
              ensuring you never lose any work. Complete control over your listings: The landlord portal gives you the
              flexibility to edit, update, or delete accommodations with just a few clicks. Whether you need to adjust
              pricing, add new photos, or make changes to the property description, our system makes it simple.
            </p>
          </div>
  
          <div className="bg-gradient-to-br from-lime-300 to-lime-400 rounded-3xl p-8 md:p-10">
            <h3 className="text-2xl md:text-3xl font-bold text-green-900 mb-6 leading-tight">
              Find your <span className="font-script italic">ideal</span> tenant with our tailored booking system.
            </h3>
            <p className="text-green-800 text-sm leading-relaxed">
              Our platform&apos;s booking system provides you with comprehensive student profiles, including key details such
              as age, gender, university, and funding type (e.g., bursary, NSFAS). This valuable information empowers you
              to make informed decisions and select tenants who best match your accommodation preferences.
            </p>
          </div>
  
          {/* Bottom Row */}
          <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-3xl p-8 md:p-10 relative overflow-hidden">
            {/* Dashboard Screenshot */}
            <div className="absolute bottom-0 left-0 right-0">
              <Image
                src="/about/l.png"
                alt="Student24 Dashboard"
                width={800}
                height={300}
                className="w-full h-auto object-cover object-top"
                style={{ maxHeight: "300px" }}
              />
            </div>
            {/* Overlay to ensure text readability */}
            <div className="relative z-10 bg-gradient-to-b from-orange-300/90 to-transparent pb-32">
              <div className="bg-orange-300/80 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-orange-800 text-sm leading-relaxed">
                  Whether you&apos;re tech-savvy or not, our landlord portal makes it easy for you to create and manage your
                  listings. Our intuitive step-by-step creation tool walks you through the entire process.
                </p>
              </div>
            </div>
          </div>
  
          <div className="bg-gradient-to-br from-purple-300 to-purple-400 rounded-3xl p-8 md:p-10">
            <h3 className="text-2xl md:text-3xl font-bold text-purple-900 mb-6 leading-tight">
              Only pay when a student successfully <span className="font-script italic">moves in</span>.
            </h3>
            <p className="text-purple-800 text-sm leading-relaxed">
              There are no upfront costs or hidden fees—just a simple, transparent model that ensures you get value for
              your money. This means you can list your property and attract potential tenants without any financial risk.
              We only charge a fee once a student has booked, been accepted, and moved into your property, aligning our
              success directly with yours.
            </p>
          </div>
        </div>
      </section>
    )
  }
  