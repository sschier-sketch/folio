import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Key, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function TenantResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mypuvkzsgwanilduniup.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/confirm-tenant-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Confirm reset error:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Ungültiger Link</h1>
                <p className="text-sm text-red-100">Kein Token gefunden</p>
              </div>
            </div>
          </div>
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-6">
              Dieser Link ist ungültig. Bitte fordern Sie einen neuen Link zum Zurücksetzen Ihres Passworts an.
            </p>
            <Button onClick={() => navigate("/tenant-portal")} variant="primary" fullWidth>
              Zum Mieterportal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Passwort geändert</h1>
                <p className="text-sm text-emerald-100">Sie können sich jetzt anmelden</p>
              </div>
            </div>
          </div>
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Passwort erfolgreich geändert!
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt mit Ihrem neuen Passwort im Mieterportal anmelden.
            </p>
            <Button onClick={() => navigate("/tenant-portal")} variant="primary" fullWidth>
              Zur Anmeldung
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#3c8af7] to-[#2d6bc8] px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Neues Passwort festlegen</h1>
              <p className="text-sm text-blue-100">Wählen Sie ein sicheres Passwort</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-600 mb-2">
                Neues Passwort
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c8af7]"
                  placeholder="Mindestens 6 Zeichen"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-600 mb-2">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c8af7]"
                  placeholder="Passwort wiederholen"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} variant="primary" fullWidth>
              {loading ? "Wird gespeichert..." : "Passwort speichern"}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate("/tenant-portal")}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Zurück zur Anmeldung
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
