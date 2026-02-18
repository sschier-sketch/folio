import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { SignupForm } from "../components/auth/SignupForm";
import { useAuth } from "../hooks/useAuth";
import {
  CheckCircle2,
  Building2,
  Users,
  BarChart3,
  FileText,
  Shield,
  Gift,
} from "lucide-react";
import { RefLink } from "../components/common/RefLink";
import { getReferralCode } from "../lib/referralTracking";

const BENEFITS = [
  {
    icon: Building2,
    title: "Unbegrenzt Objekte",
    text: "Verwalten Sie beliebig viele Immobilien an einem Ort.",
  },
  {
    icon: Users,
    title: "Mieterverwaltung",
    text: "Mieter, Verträge und Kommunikation zentral organisiert.",
  },
  {
    icon: BarChart3,
    title: "Finanzen im Blick",
    text: "Mieteingänge, Ausgaben und Rendite übersichtlich tracken.",
  },
  {
    icon: FileText,
    title: "Dokumente & Vorlagen",
    text: "Alle Unterlagen digital und sicher archiviert.",
  },
];

const TRUST_POINTS = [
  "DSGVO-konform & SSL-verschlüsselt",
  "Keine Zahlungsdaten erforderlich",
  "Automatisch 30 Tage alle Pro-Funktionen gratis",
];

export function Signup() {
  const { user, loading } = useAuth();
  const [hasReferralCode, setHasReferralCode] = useState(false);

  useEffect(() => {
    const refCode = getReferralCode();
    setHasReferralCode(!!refCode);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3c8af7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="py-16 sm:py-24 px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">
          <div className="hidden lg:block">
            <div className="sticky top-28">
              {hasReferralCode && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">
                    Sie erhalten 2 Monate PRO gratis!
                  </span>
                </div>
              )}

              <h1 className="text-[36px] lg:text-[44px] font-bold text-gray-900 tracking-tight leading-[1.1] mb-4">
                Starten Sie jetzt mit{" "}
                <span className="text-[#3c8af7]">rentably</span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-[460px] mb-10">
                Erstellen Sie Ihr Konto in weniger als 60 Sekunden und verwalten
                Sie Ihre Immobilien professionell &ndash; kostenlos.
              </p>

              <div className="space-y-5 mb-10">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#EEF4FF] border border-[#DDE7FF] flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5">
                        {b.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {b.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-8">
                <img
                  src="/dsvgo-de.png"
                  alt="DSGVO-konform"
                  className="h-16 w-auto object-contain"
                />
                <img
                  src="/entwickelt-in-deutschland-de.png"
                  alt="Entwickelt in Deutschland"
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="lg:hidden text-center mb-8">
              {hasReferralCode && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-4">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">
                    Sie erhalten 2 Monate PRO gratis!
                  </span>
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
                Konto erstellen
              </h1>
              <p className="text-gray-500">
                Kostenlos starten &ndash; keine Zahlungsdaten n&ouml;tig.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <div className="hidden lg:flex items-center gap-3 mb-8">
                <div className="w-11 h-11 rounded-full bg-[#EEF4FF] border border-[#DDE7FF] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Konto erstellen</h2>
                  <p className="text-sm text-gray-500">Kostenlos & unverbindlich</p>
                </div>
              </div>

              <SignupForm
                onSuccess={() => (window.location.href = "/dashboard")}
              />

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Bereits registriert?{" "}
                  <RefLink
                    to="/login"
                    className="font-semibold text-[#3c8af7] hover:text-[#3579de] transition-colors"
                  >
                    Jetzt anmelden
                  </RefLink>
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-2.5">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-2.5 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-[#3c8af7] flex-shrink-0" />
                  <span className="text-sm text-gray-500">{point}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-6 justify-center lg:hidden">
              <img
                src="/dsvgo-de.png"
                alt="DSGVO-konform"
                className="h-12 w-auto object-contain"
              />
              <img
                src="/entwickelt-in-deutschland-de.png"
                alt="Entwickelt in Deutschland"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
