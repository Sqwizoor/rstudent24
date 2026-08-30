"use client";

import React from "react";
import HeroSection from "./HeroSection";
import FooterSection from "./FooterSection";
import CityCard from "./CitySelection";
import BlogSection from "./BlogSection";
import RandomListings from "./RandomListings";
import ReferralSection from "./ReferralSection";

export default function LandingContent() {
  return (
    <div>
      <HeroSection />
      <CityCard />
      <RandomListings />
      <ReferralSection />
      <BlogSection />
      <FooterSection />
    </div>
  );
}
