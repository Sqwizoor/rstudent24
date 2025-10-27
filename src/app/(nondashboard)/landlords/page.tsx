"use client";

import { Button } from "@/components/ui/button";
import { useSignInRedirect } from "@/hooks/useSignInRedirect";
import FooterSection from "../landing/FooterSection";

import LandlordHero from "./landlord-hero";
import FeaturesLandSection from "./Featured";
import HowItWorks from "./how-it-works";
import BenefitsSection from "./benefits-section";

export default function LandlordsPage() {
  const { redirectToSignin, signupUrl } = useSignInRedirect();

  return (
    <div className="min-h-screen">
      <LandlordHero />
      <FeaturesLandSection />

      <HowItWorks />
      <BenefitsSection />


      {/* CTA Section */}
      <section className="py-16 bg-[#00acee]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Ready to list your accommodation with us?
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              className="bg-white text-[#00acee] hover:bg-gray-100 font-medium px-8 py-6 rounded-full text-lg"
              onClick={redirectToSignin}
            >
              Login to your account
            </Button>
            <Button
              className="bg-[#00acee] border-2 border-white text-white hover:bg-[#0099d4] font-medium px-8 py-6 rounded-full text-lg"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = signupUrl;
                }
              }}
            >
              Create an account
            </Button>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
