import HeroSection from "./landing/HeroSection";
import ProblemSection from "./landing/ProblemSection";
import HowItWorksSection from "./landing/HowItWorksSection";
import FeatureHighlight from "./landing/FeatureHighlight";
import FeatureGrid from "./landing/FeatureGrid";
import MobileSection from "./landing/MobileSection";
import TestimonialsSection from "./landing/TestimonialsSection";
import TrustSection from "./landing/TrustSection";
import ByLandlordsSection from "./landing/ByLandlordsSection";
import CtaSection from "./landing/CtaSection";

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeatureHighlight />
      <FeatureGrid />
      <MobileSection />
      <TestimonialsSection />
      <TrustSection />
      <ByLandlordsSection />
      <CtaSection />
    </div>
  );
}
