import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Eye, EyeOff, UserPlus, Gift } from "lucide-react";
import { getAffiliateCode, initAffiliateTracking } from "../../lib/affiliateTracking";

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    initAffiliateTracking();
    const code = getAffiliateCode();
    if (code) {
      setAffiliateCode(code);
    }
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters long",
      });
      setLoading(false);
      return;
    }
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: { affiliate_code: affiliateCode || null },
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (authData.user) {
        if (affiliateCode) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-affiliate-referral`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  userId: authData.user.id,
                  affiliateCode: affiliateCode,
                }),
              }
            );

            if (response.ok) {
              setMessage({
                type: "success",
                text: "Konto erfolgreich erstellt! Sie wurden über einen Partner-Link registriert.",
              });
            } else {
              setMessage({
                type: "success",
                text: "Konto erfolgreich erstellt!",
              });
            }
          } catch (affiliateError) {
            console.error("Error creating affiliate referral:", affiliateError);
            setMessage({
              type: "success",
              text: "Konto erfolgreich erstellt!",
            });
          }
        } else {
          setMessage({ type: "success", text: "Konto erfolgreich erstellt!" });
        }
        onSuccess?.();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Ein unerwarteter Fehler ist aufgetreten" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {" "}
      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
        >
          {" "}
          {message.text}{" "}
        </div>
      )}{" "}
      <div>
        {" "}
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {" "}
          Email Address{" "}
        </label>{" "}
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          placeholder="Enter your email"
        />{" "}
      </div>{" "}
      <div>
        {" "}
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {" "}
          Password{" "}
        </label>{" "}
        <div className="relative">
          {" "}
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="Enter your password"
          />{" "}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {" "}
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      <div>
        {" "}
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {" "}
          Confirm Password{" "}
        </label>{" "}
        <div className="relative">
          {" "}
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="Confirm your password"
          />{" "}
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {" "}
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {affiliateCode && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <Gift className="h-5 w-5" />
            <p className="text-sm font-semibold">
              Sie registrieren sich über einen Partner-Link!
            </p>
          </div>
          <p className="text-xs text-emerald-700 mt-1">
            Partner Code: <span className="font-mono font-bold">{affiliateCode}</span>
          </p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {" "}
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {" "}
            <UserPlus className="w-4 h-4 mr-2" /> Create Account{" "}
          </>
        )}{" "}
      </button>{" "}
    </form>
  );
}
