import { useNavigate } from 'react-router-dom';
import { withRef } from '../lib/referralTracking';
import {
  Shield,
  Zap,
  Users,
  LineChart,
  ArrowRight,
} from 'lucide-react';

const VALUES = [
  {
    icon: Shield,
    title: 'Datenschutz zuerst',
    text: 'Alle Daten werden DSGVO-konform in deutschen Rechenzentren gespeichert. Ihre Immobiliendaten gehoeren Ihnen -- immer.',
  },
  {
    icon: Zap,
    title: 'Einfachheit',
    text: 'Komplexe Verwaltungsprozesse auf das Wesentliche reduziert. Kein Handbuch noetig, keine Schulung erforderlich.',
  },
  {
    icon: Users,
    title: 'Fuer private Vermieter',
    text: 'Entwickelt von Vermietern, fuer Vermieter. Wir kennen die echten Herausforderungen aus erster Hand.',
  },
  {
    icon: LineChart,
    title: 'Transparenz',
    text: 'Klare Preise, keine versteckten Kosten. Sie sehen jederzeit, was passiert und behalten die volle Kontrolle.',
  },
];

const TIMELINE = [
  { year: '2024', label: 'Idee & erste Prototypen' },
  { year: '2025', label: 'Closed Beta mit ersten Vermietern' },
  { year: '2026', label: 'Oeffentlicher Launch von Rentably' },
];

export default function UeberUns() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Immobilienverwaltung,{' '}
            <span className="text-[#3c8af7]">neu gedacht</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Rentably entstand aus der Ueberzeugung, dass private Vermieter
            bessere Werkzeuge verdienen -- ohne die Komplexitaet und Kosten
            professioneller Hausverwaltungssoftware.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Unsere Mission
          </h2>
          <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-8 sm:p-10">
            <p className="text-gray-600 leading-relaxed text-center text-lg">
              Wir machen Immobilienverwaltung zugaenglich. Egal ob Sie eine
              Eigentumswohnung oder ein kleines Portfolio verwalten -- Rentably
              gibt Ihnen die Werkzeuge, die bisher nur grossen
              Hausverwaltungen vorbehalten waren. Digital, uebersichtlich und
              fair bepreist.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-[960px] mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Warum Rentably
          </h2>
          <p className="mt-3 text-gray-500 text-center max-w-xl mx-auto">
            Vier Prinzipien, die unsere Entwicklung leiten.
          </p>

          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="border border-gray-200 rounded-2xl p-7 hover:border-gray-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <v.icon className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Unser Weg
          </h2>

          <div className="mt-12 relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

            <div className="space-y-8">
              {TIMELINE.map((item, i) => (
                <div key={item.year} className="flex items-start gap-5 relative">
                  <div
                    className={`w-[15px] h-[15px] rounded-full flex-shrink-0 mt-0.5 border-2 ${
                      i === TIMELINE.length - 1
                        ? 'border-[#3c8af7] bg-[#3c8af7]'
                        : 'border-gray-300 bg-white'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {item.year}
                    </span>
                    <p className="mt-0.5 text-sm font-medium text-gray-700">
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Bereit, Ihre Vermietung zu vereinfachen?
          </h2>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto">
            Starten Sie kostenlos und erleben Sie, wie einfach
            Immobilienverwaltung sein kann.
          </p>
          <button
            onClick={() => navigate(withRef('/signup'))}
            className="mt-8 h-[46px] px-7 rounded-xl text-sm font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors inline-flex items-center gap-2"
          >
            Jetzt kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
