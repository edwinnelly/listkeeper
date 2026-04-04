"use client";

import { useEffect } from "react";
import {
  Navbar,
  HeroSlider,
  TrustedBy,
  StatsCounter,
  Features,
  ProductShowcase,
  DemoVideo,
  Testimonials,
  Pricing,
  Integrations,
  CTASection,
  Footer,
  AIAssistant,
} from "./components";

export default function Home() {
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, []);

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Navbar />
      <HeroSlider />
      <TrustedBy />
      
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <StatsCounter target={10000} label="Businesses Trust Us" suffix="+" />
            <StatsCounter target={50} label="Million Items Managed" suffix="M+" />
            <StatsCounter target={99.9} label="Uptime Guarantee" suffix="%" />
          </div>
        </div>
      </section>

      <Features />
      <ProductShowcase />
      <DemoVideo />
      <Testimonials />
      <Pricing />
      <Integrations />
      <CTASection />
      <Footer />
      <AIAssistant />
    </div>
  );
}