import { Building2, TrendingUp, Users, MessageSquare, FileText, Shield, Sparkles, Check, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { Header } from './Header';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />

      <main>
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 pt-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">Objekte & Mieter anlegen komplett gratis</span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6 leading-tight">
                Immobilienverwaltung<br />
                <span className="text-primary-blue">neu gedacht</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                Die moderne Software-Lösung für kleine Vermieter. Verwalten Sie Ihre Immobilien,
                Mieter und Finanzen an einem Ort – einfach, übersichtlich und professionell.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-primary-blue text-white text-lg rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Kostenlos registrieren
                </button>
                <p className="text-sm text-gray-300">
                  Keine Kreditkarte erforderlich
                </p>
              </div>
            </div>

            <div className="bg-primary-blue rounded-3xl p-8 mb-20 text-white shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">Transparente Preise</h2>
                <p className="text-white/70">Starten Sie kostenlos und upgraden Sie bei Bedarf</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border-2 border-white/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Kostenlos</h3>
                  </div>
                  <p className="text-3xl font-bold mb-6">0 <span className="text-lg font-normal">EUR / Monat</span></p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                      <span>Unbegrenzt Objekte anlegen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                      <span>Unbegrenzt Mieter anlegen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                      <span>Basis-Objektverwaltung</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                      <span>Mieterdaten speichern</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-2xl p-6 text-dark shadow-xl border-4 border-amber-400 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-400 text-dark px-4 py-1 text-xs font-bold rounded-bl-lg">
                    BELIEBT
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Premium</h3>
                  </div>
                  <p className="text-3xl font-bold mb-6">9 <span className="text-lg font-normal">EUR / Monat</span></p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                      <span className="font-medium">Alles aus Kostenlos, plus:</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                      <span>Ticketsystem für Mieter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                      <span>Mieterhöhungs-Erinnerungen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                      <span>Renditeberechnung</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                      <span>Finanzanalysen</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-20">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-primary-blue/10 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-7 h-7 text-primary-blue" />
                </div>
                <h3 className="text-xl font-semibold text-dark mb-3">Objektverwaltung</h3>
                <p className="text-gray-400">
                  Verwalten Sie alle Ihre Immobilien zentral mit detaillierten Informationen zu
                  Wert, Krediten und Rendite.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-dark mb-3">Mieterverwaltung</h3>
                <p className="text-gray-400">
                  Speichern Sie Mieterdaten, Verträge und Zahlungsinformationen übersichtlich
                  an einem Ort.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-dark mb-3">Ticketsystem</h3>
                <p className="text-gray-400">
                  Mieter können direkt über das integrierte Ticketsystem mit Ihnen kommunizieren
                  und Anliegen melden.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 mb-20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-dark mb-6">
                    Alle Funktionen auf einen Blick
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <TrendingUp className="w-4 h-4 text-primary-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-dark">Renditeberechnung</h4>
                        <p className="text-gray-400">Automatische Berechnung der Objektrendite basierend auf Mieteinnahmen und Kosten</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <FileText className="w-4 h-4 text-primary-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-dark">Automatische Mieterhöhungs-Erinnerungen</h4>
                        <p className="text-gray-400">Werden Sie 3 Monate vor Index- und Staffelmiete-Erhöhungen automatisch per Ticket erinnert</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <MessageSquare className="w-4 h-4 text-primary-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-dark">Mieter-Kommunikation</h4>
                        <p className="text-gray-400">Integriertes Ticketsystem für professionelle Kommunikation mit Ihren Mietern</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Shield className="w-4 h-4 text-primary-blue" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-dark">Kreditverwaltung</h4>
                        <p className="text-gray-400">Behalten Sie den Überblick über Ihre Finanzierungen und Kreditkosten</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-primary-blue rounded-2xl p-8 text-white">
                  <div className="text-6xl font-bold mb-2">€</div>
                  <h3 className="text-2xl font-bold mb-4">Kostenlos starten</h3>
                  <p className="text-white/70 mb-6">
                    Testen Sie Rentab.ly unverbindlich und überzeugen Sie sich selbst von den Vorteilen
                    einer modernen Immobilienverwaltung.
                  </p>
                  <button
                    onClick={() => navigate('/signup')}
                    className="w-full px-6 py-3 bg-white text-primary-blue rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Jetzt Account erstellen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
