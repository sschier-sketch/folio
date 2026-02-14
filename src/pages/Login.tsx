import { Navigate } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";
import { CheckCircle2 } from "lucide-react";
import { RefLink } from "../components/common/RefLink";

const TRUST_POINTS = [
  "DSGVO-konform & SSL-verschlüsselt",
  "Keine Kreditkarte erforderlich",
  "Über 10.000 zufriedene Vermieter",
];

export function Login() {
  const { user, loading, isBanned, checkingBan } = useAuth();

  if (loading || checkingBan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3c8af7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (isBanned) return <Navigate to="/account-banned" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="py-16 sm:py-24 px-6">
      <div className="max-w-[440px] mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-[#EEF4FF] border border-[#DDE7FF] flex items-center justify-center mx-auto mb-6">
            <img src="/rentably-logo.svg" alt="rentably" className="h-7 w-auto" />
          </div>
          <h1 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-3">
            Willkommen zur&uuml;ck
          </h1>
          <p className="text-gray-500">
            Melden Sie sich an, um Ihre Immobilien zu verwalten.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <LoginForm onSuccess={() => (window.location.href = "/dashboard")} />

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Noch kein Konto?{" "}
              <RefLink
                to="/signup"
                className="font-semibold text-[#3c8af7] hover:text-[#3579de] transition-colors"
              >
                Jetzt kostenlos registrieren
              </RefLink>
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-3">
          {TRUST_POINTS.map((point) => (
            <div key={point} className="flex items-center gap-3 justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#3c8af7] flex-shrink-0" />
              <span className="text-sm text-gray-500">{point}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
