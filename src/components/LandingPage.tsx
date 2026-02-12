import HeroSection from "./landing/HeroSection";
import ProblemSection from "./landing/ProblemSection";
import HowItWorksSection from "./landing/HowItWorksSection";
import FeatureHighlight from "./landing/FeatureHighlight";
import TestimonialsSection from "./landing/TestimonialsSection";
import ByLandlordsSection from "./landing/ByLandlordsSection";
import PricingSection from "./landing/PricingSection";
import TrustSection from "./landing/TrustSection";
import FaqSection from "./landing/FaqSection";
import SeoTextSection from "./landing/SeoTextSection";
import CtaSection from "./landing/CtaSection";

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeatureHighlight />
      <TestimonialsSection />
      <ByLandlordsSection />
      <PricingSection />
      <TrustSection />
      <FaqSection />
      <SeoTextSection />
      <CtaSection />
    </div>
  );
}
