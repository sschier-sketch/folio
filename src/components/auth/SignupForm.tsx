import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Eye, EyeOff, UserPlus, Gift } from "lucide-react";
import { getReferralCode, getReferralMetadata, initReferralTracking, clearReferralCode } from "../../lib/referralTracking";
import { getRefSid } from "../../lib/referralSession";
import { Button } from '../ui/Button';

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    initReferralTracking();
    const code = getReferralCode();
    if (code) {
      setAffiliateCode(code);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!acceptTerms) {
      setMessage({ type: "error", text: "Sie müssen die Nutzungsbedingungen akzeptieren" });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Die Passwörter stimmen nicht überein" });
      setLoading(false);
      return;
    }
    if (password.length < 10) {
      setMessage({
        type: "error",
        text: "Das Passwort muss mindestens 10 Zeichen lang sein",
      });
      setLoading(false);
      return;
    }

    const refCode = affiliateCode || getReferralCode() || null;
    const metadata = getReferralMetadata();

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            affiliate_code: refCode,
            newsletter_opt_in: newsletterOptIn,
          },
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (authData.user) {
        try {
          const welcomeRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                userId: authData.user.id,
                email: authData.user.email,
              }),
            }
          );
          if (!welcomeRes.ok) {
            const errData = await welcomeRes.text();
            console.error("Welcome email failed:", welcomeRes.status, errData);
          }
        } catch (welcomeErr) {
          console.error("Welcome email error:", welcomeErr);
        }

        const refSid = getRefSid();
        if (refCode || refSid) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-affiliate-referral`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                  userId: authData.user.id,
                  affiliateCode: refCode || null,
                  refSid: refSid || null,
                  landingPath: metadata?.landingPath || null,
                  attributionSource: metadata?.source || 'storage',
                }),
              }
            );

            if (response.ok) {
              clearReferralCode();
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
      <input type="hidden" name="ref" value={affiliateCode} />
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          E-Mail-Adresse
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          placeholder="ihre@email.de"
        />
      </div>{" "}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Passwort
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="Mindestens 10 Zeichen"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>{" "}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Passwort bestätigen
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="Passwort wiederholen"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
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

      <div className="space-y-4">
        <div className="flex items-start">
          <input
            id="acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
            required
          />
          <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600">
            Ich akzeptiere die{' '}
            <a href="/agb" target="_blank" className="text-primary-blue hover:underline">
              allgemeinen Geschäftsbedingungen
            </a>
            ,{' '}
            <a href="/datenschutz" target="_blank" className="text-primary-blue hover:underline">
              Datenschutzbestimmungen
            </a>
            {' '}und{' '}
            <a href="/avv" target="_blank" className="text-primary-blue hover:underline">
              AVV
            </a>
            {' '}<span className="text-red-500">*</span>
          </label>
        </div>

        <div className="flex items-start">
          <input
            id="newsletterOptIn"
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => setNewsletterOptIn(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
          />
          <label htmlFor="newsletterOptIn" className="ml-2 text-sm text-gray-600">
            Ja, ich möchte über Neuigkeiten informiert werden
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        variant="primary"
        fullWidth
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" /> Konto erstellen
          </>
        )}
      </Button>{" "}
    </form>
  );
}
