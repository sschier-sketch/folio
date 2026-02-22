import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Key, Mail, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { hashPassword, generateSalt } from "../lib/passwordUtils";
import { Button } from "../components/ui/Button";

type Step = "email" | "password" | "success";

export default function TenantPortalSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: tenants, error: fetchError } = await supabase
        .from("tenants")
        .select("id, first_name, last_name, password_hash, password_salt")
        .eq("email", email.toLowerCase().trim());

      if (fetchError) throw fetchError;

      if (!tenants || tenants.length === 0) {
        setError("Kein Mieter mit dieser E-Mail-Adresse gefunden. Bitte prüfen Sie die Adresse oder wenden Sie sich an Ihren Vermieter.");
        setLoading(false);
        return;
      }

      const tenant = tenants[0];

      if (tenant.password_hash && tenant.password_salt) {
        setError("Für dieses Konto wurde bereits ein Passwort eingerichtet. Bitte melden Sie sich im Mieterportal an.");
        setLoading(false);
        return;
      }

      setTenantId(tenant.id);
      setTenantName([tenant.first_name, tenant.last_name].filter(Boolean).join(" "));
      setStep("password");
    } catch (err) {
      console.error("Email check error:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
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
      const salt = generateSalt();
      const hash = await hashPassword(password, salt);
      const now = new Date().toISOString();

      const tokenValue = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from("tenant_impersonation_tokens").insert({
        tenant_id: tenantId,
        token: tokenValue,
        expires_at: expiresAt.toISOString(),
      });

      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          password_hash: hash,
          password_salt: salt,
          last_login: now,
          portal_activated_at: now,
        })
        .eq("id", tenantId);

      if (updateError) throw updateError;

      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      localStorage.setItem(
        "tenant_session",
        JSON.stringify({ tenantId, email: email.toLowerCase().trim(), expiry: expiry.toISOString() })
      );

      setStep("success");
    } catch (err) {
      console.error("Set password error:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#3c8af7] to-[#2d6bc8] px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {step === "email" && "Mieterportal aktivieren"}
                {step === "password" && "Passwort festlegen"}
                {step === "success" && "Konto aktiviert!"}
              </h1>
              <p className="text-sm text-blue-100">
                {step === "email" && "Geben Sie Ihre E-Mail-Adresse ein"}
                {step === "password" && `Willkommen${tenantName ? `, ${tenantName}` : ""}`}
                {step === "success" && "Sie können sich jetzt anmelden"}
              </p>
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

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c8af7]"
                    placeholder="ihre.email@beispiel.de"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>So funktioniert es:</strong> Geben Sie die E-Mail-Adresse ein, die Sie von Ihrem Vermieter erhalten haben. Im nächsten Schritt legen Sie Ihr persönliches Passwort fest.
                </p>
              </div>

              <Button type="submit" disabled={loading} variant="primary" fullWidth>
                {loading ? "Wird geprüft..." : "Weiter"}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/tenant-portal")}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Bereits registriert? Zur Anmeldung
                </button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-gray-500 border border-gray-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-600 mb-2">
                  Passwort festlegen
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
                {loading ? "Wird eingerichtet..." : "Passwort speichern & aktivieren"}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Zurück
                </button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Ihr Konto wurde erfolgreich aktiviert!
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                Sie können sich ab sofort mit Ihrer E-Mail-Adresse und Ihrem Passwort im Mieterportal anmelden.
              </p>
              <Button
                onClick={() => navigate("/tenant-portal")}
                variant="primary"
                fullWidth
              >
                Zum Mieterportal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
