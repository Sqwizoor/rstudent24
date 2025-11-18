import { Heart, Target, Lightbulb, Bookmark } from "lucide-react"

export default function FeaturesLandSection() {
  return (
    <section className="py-16 px-4 md:px-8 lg:px-12 max-w-9xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Main Feature */}
        <div className="lg:col-span-5 bg-[#00acee]/10 rounded-3xl p-8 md:p-12">
          <div className="mb-2">
            <span className="text-[#00acee] text-sm font-medium">Student24 at your service</span>
            <div className="w-16 h-0.5 bg-[#00acee] mt-1"></div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-6 mb-6">
            South Africa&apos;s <span className="font-script italic">leading</span> student accommodation portal.
          </h2>

          <p className="text-slate-700 leading-relaxed">
            We connect student accommodations with students looking for a place to stay. Since 2021, we have grown
            massively to bring you some of the leading and biggest developments in South Africa! We have expanded our
            work nationwide! We are dedicated to seamlessly connecting students to quality student accommodations like
            yours.
          </p>
        </div>

        {/* Right Column - Feature Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1 - Responsive Support */}
          <div className="flex gap-4">
            <div className="bg-[#00acee]/10 p-4 rounded-xl h-fit">
              <Heart className="w-6 h-6 text-[#00acee]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Responsive support</h3>
              <p className="text-slate-600 text-sm">
                Whether you&apos;re new to online property management or a seasoned landlord, we offer guidance and
                assistance whenever you need it.
              </p>
            </div>
          </div>

          {/* Feature 2 - Targeted Audience */}
          <div className="flex gap-4">
            <div className="bg-[#00acee]/10 p-4 rounded-xl h-fit">
              <Target className="w-6 h-6 text-[#00acee]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Targeted audience</h3>
              <p className="text-slate-600 text-sm">
                Our platform is dedicated to student housing, ensuring your property is seen by thousands of students
                actively searching for accommodation.
              </p>
            </div>
          </div>

          {/* Feature 3 - Easy Listing Process */}
          <div className="flex gap-4">
            <div className="bg-[#00acee]/10 p-4 rounded-xl h-fit">
              <Lightbulb className="w-6 h-6 text-[#00acee]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Easy listing process</h3>
              <p className="text-slate-600 text-sm">
                Our step-by-step guide makes it simple to create and manage your accommodation listings, even if you&apos;re
                not tech-savvy.
              </p>
            </div>
          </div>

          {/* Feature 4 - Booking Management */}
          <div className="flex gap-4">
            <div className="bg-[#00acee]/10 p-4 rounded-xl h-fit">
              <Bookmark className="w-6 h-6 text-[#00acee]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Booking management</h3>
              <p className="text-slate-600 text-sm">
                Accept or decline bookings with ease, and track all your accommodation requests in one place with our
                booking system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
