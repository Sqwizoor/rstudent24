import React from "react";
import HeroSection from "./HeroSection";
import CallToActionSection from "./CallToActionSection";
import FooterSection from "./FooterSection";
import CityCard from "./CitySelection";
import BlogSection from "./BlogSection";
import RandomListings from "./RandomListings";

function Landing() {
  return (
    <div>
      <HeroSection />
      <CityCard />
      <RandomListings />
      {/* <FeaturesSection /> */}
      <BlogSection />
      {/* <DiscoverSection/> */}
      <CallToActionSection />
      <FooterSection />
    </div>
  );
}

export default Landing;
