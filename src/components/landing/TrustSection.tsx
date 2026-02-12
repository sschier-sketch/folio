import { Calendar, MapPin, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TRUST_ITEMS: { icon: LucideIcon; headline: string; text: string }[] = [
  {
    icon: Calendar,
    headline: "Seit 2017",
    text: "Erfahrung in der Entwicklung von Software für Immobilienverwaltung.",
  },
  {
    icon: MapPin,
    headline: "Entwickelt in Deutschland",
    text: "Hosting auf europäischen Servern. Ihre Daten bleiben in Deutschland.",
  },
  {
    icon: ShieldCheck,
    headline: "DSGVO-konform",
    text: "Vollständig konforme Datenverarbeitung. Keine Weitergabe an Dritte.",
  },
];

export default function TrustSection() {
  return (
    <section className="py-[100px] px-6 bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 max-w-[700px]">
          Ihre Daten in sicheren Händen
        </h2>
        <p className="text-gray-500 leading-relaxed mb-14 max-w-[650px]">
          Rentably wird in Deutschland betrieben und erfüllt die
          Anforderungen der DSGVO. Ihre Immobiliendaten gehören Ihnen
          &ndash; heute und in Zukunft.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.headline}
              className="bg-white border border-[#e5e7eb] rounded-xl p-8"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
              >
                <item.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {item.headline}
              </div>
              <p className="text-gray-500 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
