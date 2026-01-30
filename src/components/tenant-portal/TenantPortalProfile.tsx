import { useState } from "react";
import { User, Key, Mail, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  hashPassword,
  generateSalt,
  verifyPassword,
} from "../../lib/passwordUtils";

interface TenantPortalProfileProps {
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
}

export default function TenantPortalProfile({
  tenantId,
  tenantName,
  tenantEmail,
}: TenantPortalProfileProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (newPassword.length < 6) {
        setError("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Die neuen Passwörter stimmen nicht überein.");
        setLoading(false);
        return;
      }

      const { data: tenant, error: fetchError } = await supabase
        .from("tenants")
        .select("password_hash, password_salt")
        .eq("id", tenantId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!tenant) {
        setError("Mieter nicht gefunden.");
        setLoading(false);
        return;
      }

      const isValidCurrent = await verifyPassword(
        currentPassword,
        tenant.password_salt,
        tenant.password_hash
      );

      if (!isValidCurrent) {
        setError("Das aktuelle Passwort ist falsch.");
        setLoading(false);
        return;
      }

      const newSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newSalt);

      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          password_hash: newHash,
          password_salt: newSalt,
        })
        .eq("id", tenantId);

      if (updateError) throw updateError;

      setSuccess("Passwort erfolgreich geändert!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err) {
      console.error("Error changing password:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profil
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="text"
                value={tenantName}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                disabled
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Ihr Name kann nicht geändert werden. Bitte wenden Sie sich an
              Ihren Vermieter, wenn Änderungen erforderlich sind.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              E-Mail-Adresse (Login)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="email"
                value={tenantEmail}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                disabled
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Ihre E-Mail-Adresse ist Ihr Login und kann nicht geändert werden.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Passwort ändern
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Aktuelles Passwort *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="Ihr aktuelles Passwort"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Neues Passwort *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="Mindestens 6 Zeichen"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Passwort bestätigen *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="Neues Passwort wiederholen"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Wird geändert..." : "Passwort ändern"}
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Sicherheitshinweis
            </h3>
            <p className="text-sm text-blue-800">
              Wählen Sie ein sicheres Passwort mit mindestens 6 Zeichen.
              Verwenden Sie eine Kombination aus Buchstaben, Zahlen und
              Sonderzeichen für maximale Sicherheit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
