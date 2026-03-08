import { useState, useEffect } from "react";
import { AlertCircle, Check, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { usePermissions } from "../../hooks/usePermissions";
import { Button } from "../ui/Button";

export default function ProfileDocumentsComm() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { dataOwnerId, canWrite, isMember, canViewMessages, loading: permLoading } = usePermissions();
  const isReadOnly = isMember && !canWrite;
  const emailDisabled = isMember && !canViewMessages;
  const profileUserId = dataOwnerId || user?.id;

  const [emailAlias, setEmailAlias] = useState("");
  const [currentEmailAlias, setCurrentEmailAlias] = useState("");
  const [savingAlias, setSavingAlias] = useState(false);
  const [aliasError, setAliasError] = useState("");
  const [aliasSuccess, setAliasSuccess] = useState(false);

  const [documentSenderName, setDocumentSenderName] = useState("");
  const [documentSignature, setDocumentSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!permLoading && profileUserId) {
      loadData();
      loadEmailAlias();
    }
  }, [permLoading, profileUserId]);

  const loadData = async () => {
    if (!profileUserId) return;
    try {
      const { data: profile } = await supabase
        .from("account_profiles")
        .select("document_sender_name, document_signature")
        .eq("user_id", profileUserId)
        .maybeSingle();

      if (profile) {
        setDocumentSenderName(profile.document_sender_name || "");
        setDocumentSignature(profile.document_signature || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailAlias = async () => {
    if (!profileUserId) return;
    try {
      const { data } = await supabase
        .from("user_mailboxes")
        .select("alias_localpart")
        .eq("user_id", profileUserId)
        .maybeSingle();
      if (data?.alias_localpart) {
        setEmailAlias(data.alias_localpart);
        setCurrentEmailAlias(data.alias_localpart);
      }
    } catch (error) {
      console.error("Error loading email alias:", error);
    }
  };

  const validateAlias = (val: string): string | null => {
    const v = val.toLowerCase().trim();
    if (v.length < 3) return language === "de" ? "Mindestens 3 Zeichen erforderlich." : "Minimum 3 characters required.";
    if (v.length > 64) return language === "de" ? "Maximal 64 Zeichen erlaubt." : "Maximum 64 characters allowed.";
    if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(v)) {
      return language === "de"
        ? "Erlaubt: a-z, 0-9, Punkt, Minus, Unterstrich. Muss mit Buchstabe/Zahl beginnen und enden."
        : "Allowed: a-z, 0-9, dot, hyphen, underscore. Must start and end with letter/number.";
    }
    if (v.includes("..")) return language === "de" ? "Keine aufeinanderfolgenden Punkte erlaubt." : "No consecutive dots allowed.";
    return null;
  };

  const handleSaveAlias = async () => {
    if (isReadOnly) return;
    const cleaned = emailAlias.toLowerCase().trim();
    const validationError = validateAlias(cleaned);
    if (validationError) {
      setAliasError(validationError);
      return;
    }
    if (cleaned === currentEmailAlias) {
      setAliasSuccess(true);
      setTimeout(() => setAliasSuccess(false), 2500);
      return;
    }

    setSavingAlias(true);
    setAliasError("");
    setAliasSuccess(false);

    const { data: reserved } = await supabase
      .from("reserved_email_aliases")
      .select("alias_localpart")
      .eq("alias_localpart", cleaned)
      .maybeSingle();

    if (reserved) {
      setAliasError(language === "de" ? "Dieser Alias ist reserviert und kann nicht verwendet werden." : "This alias is reserved.");
      setSavingAlias(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc("update_user_mailbox_alias", {
      new_alias: cleaned,
    });

    if (rpcError) {
      setAliasError(rpcError.message || (language === "de" ? "Fehler beim Speichern der Adresse." : "Error saving address."));
      setSavingAlias(false);
      return;
    }

    setSavingAlias(false);
    setCurrentEmailAlias(cleaned);
    setAliasSuccess(true);
    setTimeout(() => setAliasSuccess(false), 2500);
  };

  const handleSave = async () => {
    if (isReadOnly || !profileUserId) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("account_profiles")
        .update({
          document_sender_name: documentSenderName,
          document_signature: documentSignature,
        })
        .eq("user_id", profileUserId);

      if (error) throw error;
      setMessage({
        type: "success",
        text: language === "de" ? "Einstellungen gespeichert" : "Settings saved",
      });
    } catch (error) {
      console.error("Error saving:", error);
      setMessage({
        type: "error",
        text: language === "de" ? "Fehler beim Speichern" : "Error saving",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isReadOnly && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            {language === "de"
              ? "Diese Daten werden vom Hauptaccount verwaltet und können hier nur eingesehen werden."
              : "This data is managed by the main account and can only be viewed here."}
          </p>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded p-6">
        <h3 className="text-lg font-semibold text-dark mb-6">
          {language === "de" ? "Absendername für Dokumente" : "Sender Name for Documents"}
        </h3>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "de" ? "Absendername" : "Sender Name"} *
            </label>
            <input
              type="text"
              value={documentSenderName}
              onChange={(e) => !isReadOnly && setDocumentSenderName(e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              {language === "de"
                ? "Dieser Name erscheint als Absender auf Abrechnungen und Schreiben."
                : "This name appears as sender on statements and documents."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "de" ? "Signatur für Schreiben" : "Document Signature"} *
            </label>
            <textarea
              value={documentSignature}
              onChange={(e) => !isReadOnly && setDocumentSignature(e.target.value)}
              disabled={isReadOnly}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              {language === "de"
                ? "Diese Signatur wird am Ende von Schreiben und Mitteilungen verwendet."
                : "This signature is used at the end of documents and communications."}
            </p>
          </div>
        </div>
      </div>

      <div className={`bg-white rounded p-6 ${emailDisabled ? "opacity-60" : ""}`}>
        <h3 className="text-lg font-semibold text-dark mb-4">
          {language === "de" ? "Ihre Rentably E-Mail" : "Your Rentably Email"}
        </h3>
        {emailDisabled && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              {language === "de"
                ? "Die E-Mail-Einstellungen werden vom Hauptaccount verwaltet, da der Bereich \"Nachrichten\" für Ihr Konto nicht freigegeben ist."
                : "Email settings are managed by the main account since the Messages section is not enabled for your account."}
            </p>
          </div>
        )}
        <div className="space-y-4 max-w-2xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">
                {language === "de" ? "E-Mail-Adresse" : "Email Address"}
              </span>
              <div className="relative group">
                <button type="button" className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <Info className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <p className="font-semibold mb-1.5">
                    {language === "de" ? "Ihre persönliche Rentably E-Mail-Adresse" : "Your personal Rentably email address"}
                  </p>
                  <ul className="space-y-1 text-gray-300 leading-relaxed">
                    <li>{language === "de" ? "Wird als Absender für Ihre E-Mails verwendet" : "Used as sender for your emails"}</li>
                    <li>{language === "de" ? "Antworten werden automatisch im Posteingang angezeigt" : "Replies are shown automatically in your inbox"}</li>
                  </ul>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0">
              <input
                type="text"
                value={emailAlias}
                onChange={(e) => {
                  if (!isReadOnly && !emailDisabled) {
                    setEmailAlias(e.target.value.toLowerCase());
                    setAliasError("");
                  }
                }}
                disabled={isReadOnly || emailDisabled}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="mein-alias"
              />
              <span className="px-4 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500 font-medium whitespace-nowrap">
                @rentab.ly
              </span>
            </div>
            {aliasError && (
              <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{aliasError}</span>
              </div>
            )}
            {aliasSuccess && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200">
                <Check className="w-3.5 h-3.5" />
                <span>{language === "de" ? "E-Mail-Adresse gespeichert!" : "Email address saved!"}</span>
              </div>
            )}
            <p className="text-sm text-gray-600 mt-1">
              {language === "de"
                ? "Unter dieser Adresse empfangen und senden Sie E-Mails."
                : "You send and receive emails under this address."}
            </p>
            {!isReadOnly && !emailDisabled && emailAlias.trim() !== currentEmailAlias && emailAlias.trim().length >= 3 && (
              <Button variant="primary" onClick={handleSaveAlias} disabled={savingAlias} className="mt-2">
                {savingAlias
                  ? language === "de" ? "Speichern..." : "Saving..."
                  : language === "de" ? "Adresse speichern" : "Save Address"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} variant="primary">
            {saving
              ? language === "de" ? "Speichern..." : "Saving..."
              : language === "de" ? "Änderungen speichern" : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
