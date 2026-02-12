import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RevealOnScroll } from "../common/RevealOnScroll";

export default function CtaSection() {
  const navigate = useNavigate();

  return (
    <section className="py-[120px] px-6 bg-gray-950">
      <RevealOnScroll>
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-3xl sm:text-[36px] font-bold text-white tracking-tight leading-tight mb-4">
            Bereit, Ihre Verwaltung zu vereinfachen?
          </h2>
          <p className="text-gray-400 mb-10 max-w-lg mx-auto">
            Erstellen Sie Ihren Account in unter einer Minute.
            Komplett kostenlos im Basic-Tarif — und 30 Tage
            alle Pro-Funktionen inklusive.
          </p>
          <button
            onClick={() => navigate(withRef("/signup"))}
            className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
          >
            Jetzt kostenlos starten
          </button>
        </div>
      </RevealOnScroll>
    </section>
  );
}
