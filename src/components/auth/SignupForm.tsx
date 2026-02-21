import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Eye, EyeOff, ArrowRight, Gift, AlertCircle, CheckCircle2 } from "lucide-react";
import { getReferralCode, getReferralMetadata, initReferralTracking, clearReferralCode } from "../../lib/referralTracking";
import { getRefSid } from "../../lib/referralSession";
import { trackSignupSuccess } from "../../lib/analytics";

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
        await trackSignupSuccess();
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-700 border border-red-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}
        >
          {message.type === "error" ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <input type="hidden" name="ref" value={affiliateCode} />

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          E-Mail-Adresse
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors"
          placeholder="ihre@email.de"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
            className="w-full h-11 px-3.5 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors"
            placeholder="Mindestens 10 Zeichen"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Passwort best&auml;tigen
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full h-11 px-3.5 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] transition-colors"
            placeholder="Passwort wiederholen"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {affiliateCode && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
          <Gift className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Partner-Link erkannt
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Code: <span className="font-mono font-bold">{affiliateCode}</span>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 pt-1">
        <label htmlFor="acceptTerms" className="flex items-start gap-3 cursor-pointer group">
          <input
            id="acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-[#3c8af7] border-gray-300 rounded focus:ring-[#3c8af7] cursor-pointer"
            required
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            Ich akzeptiere die{' '}
            <a href="/agb" target="_blank" rel="noopener noreferrer" className="text-[#3c8af7] hover:text-[#3579de] font-medium transition-colors">
              AGB
            </a>
            ,{' '}
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[#3c8af7] hover:text-[#3579de] font-medium transition-colors">
              Datenschutzbestimmungen
            </a>
            {' '}und{' '}
            <a href="/avv" target="_blank" rel="noopener noreferrer" className="text-[#3c8af7] hover:text-[#3579de] font-medium transition-colors">
              AVV
            </a>
            {' '}<span className="text-red-500">*</span>
          </span>
        </label>

        <label htmlFor="newsletterOptIn" className="flex items-start gap-3 cursor-pointer group">
          <input
            id="newsletterOptIn"
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => setNewsletterOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-[#3c8af7] border-gray-300 rounded focus:ring-[#3c8af7] cursor-pointer"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            Ja, ich m&ouml;chte &uuml;ber Neuigkeiten, Produktupdates und hilfreiche Tipps informiert werden
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center bg-[#3c8af7] text-white hover:bg-[#3579de] active:bg-[#2d6bc8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/50 focus:ring-offset-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Konto erstellen
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </button>
    </form>
  );
}
