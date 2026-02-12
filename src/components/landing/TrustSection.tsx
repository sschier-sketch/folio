import { ShieldCheck } from "lucide-react";
import { RevealOnScroll } from "../common/RevealOnScroll";

export default function TrustSection() {
  return (
    <section className="py-[80px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Ihre Daten in sicheren H&auml;nden
            </h2>
            <p className="text-gray-500 leading-relaxed max-w-[600px] mx-auto">
              rentably wird in Deutschland betrieben und erf&uuml;llt die Anforderungen der DSGVO.
              Ihre Daten geh&ouml;ren Ihnen &ndash; heute und in Zukunft.
            </p>
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <img
              src="/dsgvo.png"
              alt="DSGVO-konform"
              className="h-32 w-auto object-contain"
            />
            <img
              src="/madeingermany.png"
              alt="Entwickelt in Deutschland"
              className="h-32 w-auto object-contain"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-[#0a7c42]/10 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-[#0a7c42]" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold text-gray-700 text-center leading-tight">
                TLS-Verschl&uuml;sselung
              </span>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
