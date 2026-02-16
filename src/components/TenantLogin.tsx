import { useState, useEffect } from "react";
import { LogIn, Key, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  hashPassword,
  generateSalt,
  verifyPassword,
} from "../lib/passwordUtils";

import { Button } from "./ui/Button";
interface TenantLoginProps {
  landlordId?: string;
  onLoginSuccess: (tenantId: string, tenantEmail: string) => void;
}
export default function TenantLogin({
  landlordId,
  onLoginSuccess,
}: TenantLoginProps) {
  const [mode, setMode] = useState<"login" | "setup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      handleTokenLogin(token);
    }
  }, []);

  const handleTokenLogin = async (token: string) => {
    setLoading(true);
    setError("");
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from("tenant_impersonation_tokens")
        .select("*, tenants(*)")
        .eq("token", token)
        .is("used_at", null)
        .maybeSingle();

      if (tokenError || !tokenData) {
        setError(
          "Ungültiger oder abgelaufener Anmeldelink. Bitte verwenden Sie einen neuen Link."
        );
        window.history.replaceState({}, "", window.location.pathname);
        setLoading(false);
        return;
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        setError("Dieser Anmeldelink ist abgelaufen. Bitte verwenden Sie einen neuen Link.");
        window.history.replaceState({}, "", window.location.pathname);
        setLoading(false);
        return;
      }

      const tenant = tokenData.tenants;

      const now = new Date().toISOString();

      const newTokenValue = crypto.randomUUID();
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + 24);

      await supabase.from("tenant_impersonation_tokens").insert({
        tenant_id: tenant.id,
        token: newTokenValue,
        expires_at: newExpiresAt.toISOString(),
      });

      await supabase
        .from("tenants")
        .update({
          last_login: now,
          portal_activated_at: tenant.portal_activated_at || now
        })
        .eq("id", tenant.id);

      window.history.replaceState({}, "", window.location.pathname);

      onLoginSuccess(tenant.id, tenant.email);
    } catch (err) {
      console.error("Token login error:", err);
      setError("Ein Fehler ist beim automatischen Login aufgetreten.");
      window.history.replaceState({}, "", window.location.pathname);
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let tenantsQuery = supabase
        .from("tenants")
        .select("*")
        .eq("email", email.toLowerCase().trim());
      if (landlordId) {
        tenantsQuery = tenantsQuery.eq("user_id", landlordId);
      }
      const { data: allTenants, error: allFetchError } = await tenantsQuery;
      if (allFetchError) throw allFetchError;
      if (!allTenants || allTenants.length === 0) {
        setError(
          "Kein Mieter mit dieser E-Mail-Adresse gefunden. Bitte wenden Sie sich an Ihren Vermieter.",
        );
        setLoading(false);
        return;
      }
      const tenants = allTenants[0];
      if (!tenants.password_hash || !tenants.password_salt) {
        setMode("setup");
        setLoading(false);
        return;
      }
      const isValid = await verifyPassword(
        password,
        tenants.password_salt,
        tenants.password_hash,
      );
      if (!isValid) {
        setError("Falsches Passwort.");
        setLoading(false);
        return;
      }
      const now = new Date().toISOString();

      const tokenValue = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from("tenant_impersonation_tokens").insert({
        tenant_id: tenants.id,
        token: tokenValue,
        expires_at: expiresAt.toISOString(),
      });

      await supabase
        .from("tenants")
        .update({
          last_login: now,
          portal_activated_at: tenants.portal_activated_at || now
        })
        .eq("id", tenants.id);
      onLoginSuccess(tenants.id, tenants.email);
    } catch (err) {
      console.error("Login error:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };
  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      setLoading(false);
      return;
    }
    try {
      let setupQuery = supabase
        .from("tenants")
        .select("*")
        .eq("email", email.toLowerCase().trim());
      if (landlordId) {
        setupQuery = setupQuery.eq("user_id", landlordId);
      }
      const { data: tenantResults, error: fetchError } = await setupQuery;
      if (fetchError) throw fetchError;
      const tenant = tenantResults?.[0] || null;
      if (!tenant) {
        setError("Kein Mieter mit dieser E-Mail-Adresse gefunden.");
        setLoading(false);
        return;
      }
      const salt = generateSalt();
      const hash = await hashPassword(password, salt);
      const now = new Date().toISOString();

      const tokenValue = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from("tenant_impersonation_tokens").insert({
        tenant_id: tenant.id,
        token: tokenValue,
        expires_at: expiresAt.toISOString(),
      });

      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          password_hash: hash,
          password_salt: salt,
          last_login: now,
          portal_activated_at: tenant.portal_activated_at || now,
        })
        .eq("id", tenant.id);
      if (updateError) throw updateError;
      onLoginSuccess(tenant.id, tenant.email);
    } catch (err) {
      console.error("Setup password error:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mypuvkzsgwanilduniup.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/request-tenant-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Anfordern des Links");
      }
      setSuccessMessage(data.message);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };
  if (loading && !mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-md w-full max-w-md p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-blue/10 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-primary-blue animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-dark mb-2">Anmeldung läuft...</h1>
            <p className="text-gray-400">
              Sie werden automatisch angemeldet. Bitte warten Sie einen Moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      {" "}
      <div className="bg-white rounded-md w-full max-w-md p-8">
        {" "}
        <div className="text-center mb-8">
          {" "}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-blue/10 rounded-full mb-4">
            {" "}
            <LogIn className="w-8 h-8 text-primary-blue" />{" "}
          </div>{" "}
          <h1 className="text-3xl font-bold text-dark mb-2">Mieter-Portal</h1>{" "}
          <p className="text-gray-400">
            {" "}
            {mode === "login" &&
              "Melden Sie sich mit Ihrer E-Mail und Ihrem Passwort an"}{" "}
            {mode === "setup" && "Richten Sie Ihr Passwort ein"}{" "}
            {mode === "reset" && "Setzen Sie Ihr Passwort zurück"}{" "}
          </p>{" "}
        </div>{" "}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {" "}
            {error}{" "}
          </div>
        )}{" "}
        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
            {" "}
            {successMessage}{" "}
          </div>
        )}{" "}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            {" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {" "}
                E-Mail-Adresse{" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />{" "}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="ihre.email@beispiel.de"
                  required
                />{" "}
              </div>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {" "}
                Passwort{" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />{" "}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="••••••••"
                  required
                />{" "}
              </div>{" "}
            </div>{" "}
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              fullWidth
            >
              {" "}
              {loading ? "Anmelden..." : "Anmelden"}{" "}
            </Button>{" "}
            <div className="text-center">
              {" "}
              <Button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setError("");
                  setPassword("");
                }}
                variant="text-danger"
              >
                {" "}
                Passwort vergessen?{" "}
              </Button>{" "}
            </div>{" "}
          </form>
        )}{" "}
        {mode === "setup" && (
          <form onSubmit={handleSetupPassword} className="space-y-4">
            {" "}
            <div className="p-4 bg-primary-blue/5 border border-blue-200 rounded-full text-primary-blue text-sm mb-4">
              {" "}
              Sie haben noch kein Passwort eingerichtet. Bitte wählen Sie ein
              sicheres Passwort.{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {" "}
                E-Mail-Adresse{" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />{" "}
                <input
                  type="email"
                  value={email}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50"
                  disabled
                />{" "}
              </div>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {" "}
                Neues Passwort{" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />{" "}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Mindestens 6 Zeichen"
                  required
                  minLength={6}
                />{" "}
              </div>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {" "}
                Passwort bestätigen{" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />{" "}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Passwort wiederholen"
                  required
                  minLength={6}
                />{" "}
              </div>{" "}
            </div>{" "}
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              fullWidth
            >
              {" "}
              {loading ? "Einrichten..." : "Passwort einrichten"}{" "}
            </Button>{" "}
            <div className="text-center">
              {" "}
              <Button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                variant="text-danger"
              >
                {" "}
                Zurück zur Anmeldung{" "}
              </Button>{" "}
            </div>{" "}
          </form>
        )}{" "}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm mb-4">
              Geben Sie Ihre E-Mail-Adresse ein. Sie erhalten einen Link per E-Mail, um Ihr Passwort zurückzusetzen.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="ihre.email@beispiel.de"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              fullWidth
            >
              {loading ? "Wird gesendet..." : "Link zum Zurücksetzen anfordern"}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMessage("");
                }}
                variant="text-danger"
              >
                Zurück zur Anmeldung
              </Button>
            </div>
          </form>
        )}{" "}
      </div>{" "}
    </div>
  );
}
