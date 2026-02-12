import HeroSection from "./landing/HeroSection";
import ProblemSection from "./landing/ProblemSection";
import FeatureHighlight from "./landing/FeatureHighlight";
import FeatureGrid from "./landing/FeatureGrid";
import MobileSection from "./landing/MobileSection";
import TrustSection from "./landing/TrustSection";
import CtaSection from "./landing/CtaSection";

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <ProblemSection />
      <FeatureHighlight />
      <FeatureGrid />
      <MobileSection />
      <TrustSection />
      <CtaSection />
    </div>
  );
}
