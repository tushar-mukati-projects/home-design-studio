import { Navbar } from "@/components/layout/navbar";
import { NoiseOverlay } from "./backgrounds";
import { CallToAction } from "./call-to-action";
import { FeaturesSection } from "./features-section";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { LandingFooter } from "./landing-footer";
import { Showcase } from "./showcase";
import { Stats } from "./stats";

export const LandingView = () => (
  <div className="relative min-h-screen overflow-x-hidden bg-background">
    <NoiseOverlay />
    <Navbar />
    <Hero />
    <FeaturesSection />
    <HowItWorks />
    <Showcase />
    <Stats />
    <CallToAction />
    <LandingFooter />
  </div>
);
