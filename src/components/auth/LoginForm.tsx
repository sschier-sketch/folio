import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
interface LoginFormProps {
  onSuccess?: () => void;
}
export function LoginForm({ onSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        if (data.user) {
          const { data: profileData } = await supabase
            .from("account_profiles")
            .select("banned, ban_reason")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (profileData?.banned) {
            navigate("/account-banned");
            return;
          }
        }

        setMessage({ type: "success", text: "Erfolgreich angemeldet!" });
        onSuccess?.();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Ein unerwarteter Fehler ist aufgetreten",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Magic Link wurde an Ihre E-Mail-Adresse gesendet! Bitte prüfen Sie Ihr Postfach.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Ein unerwarteter Fehler ist aufgetreten",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {" "}
      <div className="flex gap-2 p-1 bg-gray-50 rounded-lg">
        {" "}
        <button
          type="button"
          onClick={() => {
            setLoginMode("password");
            setMessage(null);
          }}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${loginMode === "password" ? "bg-white text-primary-blue shadow-sm" : "text-gray-400 hover:text-dark"}`}
        >
          {" "}
          <LogIn className="w-4 h-4 inline mr-2" /> Mit Passwort{" "}
        </button>{" "}
        <button
          type="button"
          onClick={() => {
            setLoginMode("magic");
            setMessage(null);
          }}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${loginMode === "magic" ? "bg-white text-primary-blue shadow-sm" : "text-gray-400 hover:text-dark"}`}
        >
          {" "}
          <Mail className="w-4 h-4 inline mr-2" /> Magic Link{" "}
        </button>{" "}
      </div>{" "}
      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
        >
          {" "}
          {message.text}{" "}
        </div>
      )}{" "}
      {loginMode === "password" ? (
        <form onSubmit={handlePasswordLogin} className="space-y-6">
          {" "}
          <div>
            {" "}
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              {" "}
              E-Mail-Adresse{" "}
            </label>{" "}
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="ihre@email.de"
            />{" "}
          </div>{" "}
          <div>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-400"
              >
                {" "}
                Passwort{" "}
              </label>{" "}
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="text-sm text-primary-blue hover:text-primary-blue font-medium"
              >
                {" "}
                Passwort vergessen?{" "}
              </button>{" "}
            </div>{" "}
            <div className="relative">
              {" "}
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="Ihr Passwort"
              />{" "}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {" "}
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-300" />
                )}{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-primary-blue hover:bg-primary-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {" "}
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {" "}
                <LogIn className="w-5 h-5 mr-2" /> Anmelden{" "}
              </>
            )}{" "}
          </button>{" "}
        </form>
      ) : (
        <form onSubmit={handleMagicLinkLogin} className="space-y-6">
          {" "}
          <div>
            {" "}
            <label
              htmlFor="magic-email"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              {" "}
              E-Mail-Adresse{" "}
            </label>{" "}
            <input
              id="magic-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="ihre@email.de"
            />{" "}
            <p className="mt-2 text-xs text-gray-300">
              {" "}
              Wir senden Ihnen einen sicheren Login-Link per E-Mail zu{" "}
            </p>{" "}
          </div>{" "}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-primary-blue hover:bg-primary-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {" "}
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {" "}
                <Mail className="w-5 h-5 mr-2" /> Magic Link senden{" "}
              </>
            )}{" "}
          </button>{" "}
        </form>
      )}{" "}
    </div>
  );
}
