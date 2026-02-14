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
              src="/dsvgo.png"
              alt="DSGVO-konform"
              className="h-32 w-auto object-contain"
            />
            <img
              src="/entwickelt-in-deutschland.png"
              alt="Entwickelt in Deutschland"
              className="h-32 w-auto object-contain"
            />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
