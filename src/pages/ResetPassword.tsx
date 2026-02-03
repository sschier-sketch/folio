import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle, Mail, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Header } from "../components/Header";
import Footer from "../components/Footer";

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
    const token = searchParams.get('token');
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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Anfordern des Passwort-Resets');
      }

      setMessage({
        type: "success",
        text: data.message || "Eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts wurde an Ihre Adresse gesendet. Bitte überprüfen Sie Ihr Postfach.",
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
        text: "Die Passwörter stimmen nicht überein",
      });
      setLoading(false);
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setMessage({
        type: "error",
        text: "Ungültiger Link. Bitte fordern Sie einen neuen Link an.",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-password-reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Zurücksetzen des Passworts');
      }

      setMessage({
        type: "success",
        text: data.message || "Ihr Passwort wurde erfolgreich geändert!",
      });
      setViewMode("success");

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setMessage({
        type: "error",
        text: error.message || "Fehler beim Zurücksetzen des Passworts",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4 mt-16">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark">
              {viewMode === "request" && "Passwort zurücksetzen"}
              {viewMode === "reset" && "Neues Passwort setzen"}
              {viewMode === "success" && "Erfolgreich!"}
            </h1>
            <p className="text-sm text-gray-400">
              {viewMode === "request" && "Geben Sie Ihre E-Mail-Adresse ein"}
              {viewMode === "reset" && "Wählen Sie ein neues sicheres Passwort"}
              {viewMode === "success" && "Ihr Passwort wurde geändert"}
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {message.type === "success" && (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            {message.type === "error" && (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {viewMode === "request" && (
          <form onSubmit={handleRequestReset} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="ihre@email.de"
                />
              </div>
            </div>

            <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>So funktioniert es:</strong> Sie erhalten eine E-Mail
                mit einem sicheren Link. Klicken Sie auf den Link, um Ihr
                Passwort zurückzusetzen.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-primary-blue hover:bg-primary-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Link zum Zurücksetzen senden
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-gray-400 hover:text-dark transition-colors"
              >
                Zurück zur Anmeldung
              </button>
            </div>
          </form>
        )}

        {viewMode === "reset" && (
          <form onSubmit={handlePasswordReset} className="space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-400 mb-2"
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
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Mindestens 10 Zeichen"
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
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Passwort bestätigen
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="Passwort wiederholen"
              />
            </div>

            <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Passwort-Anforderungen:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Mindestens 10 Zeichen</li>
                  <li>Empfohlen: Mix aus Buchstaben, Zahlen und Symbolen</li>
                </ul>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-primary-blue hover:bg-primary-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Passwort speichern
                </>
              )}
            </button>
          </form>
        )}

        {viewMode === "success" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-gray-600 mb-4">
              Ihr Passwort wurde erfolgreich geändert. Sie werden in Kürze zur
              Anmeldeseite weitergeleitet.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-primary-blue hover:underline text-sm font-medium"
            >
              Jetzt anmelden
            </button>
          </div>
        )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
