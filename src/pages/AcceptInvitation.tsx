import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Users, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { supabase } from "../lib/supabase";

interface InvitationInfo {
  id: string;
  email: string;
  role: string;
  role_label: string;
  owner_name: string;
  expires_at: string;
}

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Kein Einladungstoken vorhanden");
      setChecking(false);
      return;
    }

    const checkInvitation = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-account-invitation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.error);
          setStatus(data.status || null);
          return;
        }

        if (data.valid && data.invitation) {
          setInvitation(data.invitation);
        }
      } catch {
        setError("Einladung konnte nicht geprüft werden");
      } finally {
        setChecking(false);
      }
    };

    checkInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!acceptTerms) {
      setSubmitError("Bitte akzeptieren Sie die Nutzungsbedingungen");
      return;
    }

    if (password.length < 10) {
      setSubmitError("Das Passwort muss mindestens 10 Zeichen lang sein");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Die Passwörter stimmen nicht überein");
      return;
    }

    if (!invitation) return;

    setSubmitting(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            invitation_token: token,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setSubmitError(
            "Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an."
          );
        } else {
          setSubmitError(signUpError.message);
        }
        return;
      }

      if (authData.user) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch {
      setSubmitError("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {status === "accepted" && "Einladung bereits angenommen"}
            {status === "revoked" && "Einladung widerrufen"}
            {status === "expired" && "Einladung abgelaufen"}
            {!status && "Ungültige Einladung"}
          </h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Willkommen bei Rentably!</h1>
          <p className="text-gray-500">
            Ihr Account wurde erstellt. Sie werden zum Dashboard weitergeleitet...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md border border-gray-200 overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center">
          <img src="/rentably-logo.svg" alt="Rentably" className="h-6 mx-auto mb-6" />
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Einladung annehmen</h1>
          <p className="text-gray-500 text-sm">
            <strong>{invitation?.owner_name}</strong> hat Sie eingeladen, gemeinsam Immobilien auf Rentably zu verwalten.
          </p>
        </div>

        <div className="px-8 pb-2">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Shield className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Rolle:</span> {invitation?.role_label}
              </p>
              <p className="text-xs text-gray-500">{invitation?.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Passwort erstellen
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 10 Zeichen"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="accent-blue-600 mt-1"
            />
            <span className="text-xs text-gray-500">
              Ich akzeptiere die{" "}
              <a href="/agb" target="_blank" className="text-blue-600 hover:underline">
                Nutzungsbedingungen
              </a>{" "}
              und die{" "}
              <a href="/datenschutz" target="_blank" className="text-blue-600 hover:underline">
                Datenschutzerklärung
              </a>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Account erstellen & Einladung annehmen
          </button>
        </form>

        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-gray-400">
            Bereits ein Konto?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
