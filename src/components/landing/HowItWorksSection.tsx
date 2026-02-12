import { UserPlus, Building, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STEPS: { num: string; icon: LucideIcon; title: string; text: string }[] = [
  {
    num: "01",
    icon: UserPlus,
    title: "Registrieren",
    text: "Erstellen Sie kostenlos Ihr Rentably-Konto. Keine Zahlungsdaten erforderlich.",
  },
  {
    num: "02",
    icon: Building,
    title: "Objekte anlegen",
    text: "Fügen Sie Ihre Immobilien und Mieter hinzu. Alle Stammdaten an einem Ort.",
  },
  {
    num: "03",
    icon: LayoutDashboard,
    title: "Verwalten",
    text: "Mieten erfassen, Abrechnungen erstellen, Dokumente organisieren — alles digital.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
            So einfach geht's
          </h2>
          <p className="text-gray-500 max-w-[500px] mx-auto">
            In wenigen Minuten startklar — komplett kostenlos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-px bg-gray-200" />

          {STEPS.map((step) => (
            <div key={step.num} className="text-center relative">
              <div className="w-[72px] h-[72px] rounded-full border-2 border-gray-200 bg-white flex items-center justify-center mx-auto mb-6 relative z-10">
                <step.icon className="w-6 h-6 text-[#3c8af7]" />
              </div>
              <div className="text-xs font-semibold text-[#3c8af7] tracking-widest uppercase mb-2">
                Schritt {step.num}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
