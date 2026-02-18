import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Mail,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { RefLink } from "../components/common/RefLink";

type ViewMode = "request" | "reset" | "success";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setViewMode("reset");
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!email) {
      setMessage({
        type: "error",
        text: "Bitte geben Sie Ihre E-Mail-Adresse ein",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Fehler beim Anfordern des Passwort-Resets"
        );
      }

      setMessage({
        type: "success",
        text:
          data.message ||
          "Eine E-Mail mit einem Link zum Zur\u00fccksetzen Ihres Passworts wurde an Ihre Adresse gesendet. Bitte \u00fcberpr\u00fcfen Sie Ihr Postfach.",
      });
      setEmail("");
    } catch (error: any) {
      console.error("Error requesting password reset:", error);
      setMessage({
        type: "error",
        text: error.message || "Fehler beim Anfordern des Passwort-Resets",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword.length < 10) {
      setMessage({
        type: "error",
        text: "Das Passwort muss mindestens 10 Zeichen lang sein",
      });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Die Passw\u00f6rter stimmen nicht \u00fcberein",
      });
      setLoading(false);
      return;
    }

    const token = searchParams.get("token");
    if (!token) {
      setMessage({
        type: "error",
        text: "Ung\u00fcltiger Link. Bitte fordern Sie einen neuen Link an.",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Fehler beim Zur\u00fccksetzen des Passworts"
        );
      }

      setMessage({
        type: "success",
        text:
          data.message || "Ihr Passwort wurde erfolgreich ge\u00e4ndert!",
      });
      setViewMode("success");

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setMessage({
        type: "error",
        text:
          error.message || "Fehler beim Zur\u00fccksetzen des Passworts",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = React.useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "" };
    let score = 0;
    if (newPassword.length >= 10) score++;
    if (newPassword.length >= 14) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 1) return { score: 1, label: "Schwach", color: "bg-red-400" };
    if (score <= 2)
      return { score: 2, label: "Ausreichend", color: "bg-amber-400" };
    if (score <= 3) return { score: 3, label: "Gut", color: "bg-blue-400" };
    return { score: 4, label: "Stark", color: "bg-emerald-500" };
  }, [newPassword]);

  return (
    <div className="py-16 sm:py-24 px-6">
      <div className="max-w-[440px] mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-[#EEF4FF] border border-[#DDE7FF] flex items-center justify-center mx-auto mb-6">
            {viewMode === "success" ? (
              <ShieldCheck
                className="w-7 h-7 text-gray-900"
                strokeWidth={1.5}
              />
            ) : (
              <KeyRound
                className="w-7 h-7 text-gray-900"
                strokeWidth={1.5}
              />
            )}
          </div>
          <h1 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-3">
            {viewMode === "request" && "Passwort vergessen?"}
            {viewMode === "reset" && "Neues Passwort setzen"}
            {viewMode === "success" && "Passwort ge\u00e4ndert"}
          </h1>
          <p className="text-gray-500">
            {viewMode === "request" &&
              "Kein Problem \u2013 wir senden Ihnen einen Link zum Zur\u00fccksetzen."}
            {viewMode === "reset" &&
              "W\u00e4hlen Sie ein neues, sicheres Passwort f\u00fcr Ihr Konto."}
            {viewMode === "success" &&
              "Sie k\u00f6nnen sich jetzt mit Ihrem neuen Passwort anmelden."}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-100"
                  : message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-blue-50 text-blue-700 border border-blue-100"
              }`}
            >
              {message.type === "success" && (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              {message.type === "error" && (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              {message.type === "info" && (
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {viewMode === "request" && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors placeholder:text-gray-400"
                    placeholder="ihre@email.de"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#EEF4FF] border border-[#DDE7FF] p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-[#3c8af7] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Sie erhalten eine E-Mail mit einem sicheren Link. Klicken
                    Sie auf den Link, um Ihr Passwort zur&uuml;ckzusetzen.
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={loading} variant="primary" fullWidth>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Wird gesendet...
                  </span>
                ) : (
                  "Link zum Zur\u00fccksetzen senden"
                )}
              </Button>

              <div className="pt-4 border-t border-gray-100 text-center">
                <RefLink
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Zur&uuml;ck zur Anmeldung
                </RefLink>
              </div>
            </form>
          )}

          {viewMode === "reset" && (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Neues Passwort
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors placeholder:text-gray-400"
                    placeholder="Mindestens 10 Zeichen"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px] text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-[18px] w-[18px] text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i <= passwordStrength.score
                                ? passwordStrength.color
                                : "bg-gray-100"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 min-w-[70px] text-right">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Passwort best&auml;tigen
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors placeholder:text-gray-400"
                  placeholder="Passwort wiederholen"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Passw&ouml;rter stimmen nicht &uuml;berein
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-[#EEF4FF] border border-[#DDE7FF] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#3c8af7] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600 leading-relaxed">
                    <span className="font-medium text-gray-700">
                      Passwort-Anforderungen:
                    </span>
                    <ul className="mt-1.5 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 flex-shrink-0 ${newPassword.length >= 10 ? "text-emerald-500" : "text-gray-300"}`}
                        />
                        Mindestens 10 Zeichen
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 flex-shrink-0 ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /[0-9]/.test(newPassword) ? "text-emerald-500" : "text-gray-300"}`}
                        />
                        Mix aus Buchstaben und Zahlen empfohlen
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                fullWidth
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Wird gespeichert...
                  </span>
                ) : (
                  "Passwort speichern"
                )}
              </Button>
            </form>
          )}

          {viewMode === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                Ihr Passwort wurde erfolgreich ge&auml;ndert. Sie werden in
                K&uuml;rze zur Anmeldeseite weitergeleitet.
              </p>
              <Button
                onClick={() => navigate("/login")}
                variant="primary"
                fullWidth
              >
                Jetzt anmelden
              </Button>
            </div>
          )}
        </div>

        <div className="mt-10 space-y-3">
          {[
            "DSGVO-konform & SSL-verschl\u00fcsselt",
            "Sichere Token-basierte Links",
            "Link 1 Stunde g\u00fcltig",
          ].map((point) => (
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
