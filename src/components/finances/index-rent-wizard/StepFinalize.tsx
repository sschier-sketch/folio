import { useState, useEffect } from "react";
import {
  CheckCircle,
  FileText,
  Download,
  Loader2,
  AlertTriangle,
  Mail,
  Send,
  ArrowLeft,
  Paperclip,
} from "lucide-react";
import { Button } from "../../ui/Button";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import type { WizardState } from "./types";

const fmt = (v: number) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";

const formatDateDE = (iso: string) => {
  if (!iso) return "\u2013";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatEffectiveMonth = (iso: string) => {
  if (!iso) return "\u2013";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
};

type FinalizeMode = "choose" | "email-preview";

interface Props {
  state: WizardState;
  saving: boolean;
  saved: boolean;
  pdfBlob: Blob | null;
  emailSent: boolean;
  onSave: (mode: "download" | "email", emailData?: { subject: string; body: string }) => void;
}

function buildDefaultSubject(state: WizardState): string {
  return `Anpassung Ihrer Miete gem\u00E4\u00DF Indexvereinbarung \u2013 wirksam ab ${formatEffectiveMonth(state.effectiveDate)}`;
}

function buildDefaultBody(state: WizardState): string {
  const oldVal = parseFloat(state.vpiOldValue) || 0;
  const newVal = parseFloat(state.vpiNewValue) || 0;
  const newRent = oldVal > 0 ? Math.round(state.currentRent * (newVal / oldVal) * 100) / 100 : 0;
  const gesamtmiete = newRent + state.currentUtilities;

  let salutation = "Sehr geehrte Damen und Herren";
  if (state.tenantSalutation === "male") {
    salutation = `Sehr geehrter Herr ${state.tenantName.split(" ").pop()}`;
  } else if (state.tenantSalutation === "female") {
    salutation = `Sehr geehrte Frau ${state.tenantName.split(" ").pop()}`;
  }

  const lines = [
    `${salutation},`,
    "",
    `gem\u00E4\u00DF der in unserem Mietvertrag vom ${formatDateDE(state.contractDate)} vereinbarten Indexklausel (\u00A7 557b BGB) ergibt sich aufgrund der Ver\u00E4nderung des Verbraucherpreisindexes eine Anpassung Ihrer Nettokaltmiete.`,
    "",
    `Die neue monatliche Nettokaltmiete betr\u00E4gt ab dem ${formatDateDE(state.effectiveDate)}: ${fmt(newRent)}.`,
  ];

  if (state.currentUtilities > 0) {
    lines.push(`Die Betriebskostenvorauszahlung bleibt unver\u00E4ndert bei ${fmt(state.currentUtilities)}.`);
    lines.push(`Somit betr\u00E4gt die neue monatliche Gesamtmiete: ${fmt(gesamtmiete)}.`);
  }

  lines.push("");
  lines.push("Das ausf\u00FChrliche Erh\u00F6hungsschreiben mit der detaillierten Berechnung finden Sie als PDF im Anhang dieser E-Mail.");
  lines.push("");
  lines.push(`Bitte \u00FCberweisen Sie den angepassten Betrag erstmals f\u00FCr den Monat ${formatEffectiveMonth(state.effectiveDate)}.`);
  lines.push("");
  lines.push("F\u00FCr R\u00FCckfragen stehen wir Ihnen gerne zur Verf\u00FCgung.");

  return lines.join("\n");
}

export default function StepFinalize({ state, saving, saved, pdfBlob, emailSent, onSave }: Props) {
  const { user } = useAuth();
  const oldVal = parseFloat(state.vpiOldValue) || 0;
  const newVal = parseFloat(state.vpiNewValue) || 0;
  const newRent = oldVal > 0 ? Math.round(state.currentRent * (newVal / oldVal) * 100) / 100 : 0;
  const gesamtmiete = newRent + state.currentUtilities;

  const [mode, setMode] = useState<FinalizeMode>("choose");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [signature, setSignature] = useState("");
  const [signatureLoaded, setSignatureLoaded] = useState(false);

  useEffect(() => {
    if (user) loadSignature();
  }, [user]);

  async function loadSignature() {
    if (!user) return;
    const { data } = await supabase
      .from("user_mail_settings")
      .select("signature, signature_default_on")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.signature && data.signature_default_on !== false) {
      setSignature(data.signature);
    }
    setSignatureLoaded(true);
  }

  function initEmailPreview() {
    setEmailSubject(buildDefaultSubject(state));
    setEmailBody(buildDefaultBody(state));
    setMode("email-preview");
  }

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Indexmieterhoehung_${state.tenantName.replace(/\s+/g, "_")}_${state.effectiveDate}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pdfFileName = `Indexmieterhoehung_${state.tenantName.replace(/\s+/g, "_")}_${state.effectiveDate}.pdf`;

  if (saved && pdfBlob) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-dark mb-2">
            Indexmieterh\u00F6hung abgeschlossen
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {emailSent
              ? `Das Erh\u00F6hungsschreiben wurde per E-Mail an ${state.tenantEmail} gesendet, als PDF gespeichert und die neue Miete im System hinterlegt.`
              : "Das Erh\u00F6hungsschreiben wurde als PDF gespeichert und die neue Miete im System hinterlegt."}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Neue Nettokaltmiete</span>
            <span className="font-semibold text-dark">{fmt(newRent)}</span>
          </div>
          {state.currentUtilities > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Betriebskosten</span>
                <span className="text-dark">{fmt(state.currentUtilities)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="text-gray-500 font-medium">Gesamtmiete</span>
                <span className="font-bold text-dark">{fmt(gesamtmiete)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Wirksam ab</span>
            <span className="font-semibold text-dark">{formatDateDE(state.effectiveDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status im System</span>
            <span className="font-semibold text-dark">
              {state.effectiveDate <= new Date().toISOString().split("T")[0] ? "Aktiv" : "Geplant (wird automatisch aktiv)"}
            </span>
          </div>
          {emailSent && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">E-Mail</span>
              <span className="font-semibold text-emerald-600">Gesendet an {state.tenantEmail}</span>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button onClick={handleDownload} variant="secondary">
            <Download className="w-4 h-4 mr-1.5" />
            PDF herunterladen
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "email-preview") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode("choose")}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-dark">E-Mail-Vorschau</h3>
            <p className="text-sm text-gray-500">
              Die Indexmieterh\u00F6hung wird als PDF an {state.tenantEmail} gesendet.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <span className="font-medium">An:</span> {state.tenantName} &lt;{state.tenantEmail}&gt;
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Betreff</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nachricht</label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={10}
            disabled={saving}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        {signature && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Signatur</p>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{signature}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate">{pdfFileName}</span>
          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">PDF-Anhang</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 leading-relaxed">
              Beim Senden wird das PDF generiert, als Dokument gespeichert (dem Mieter zugeordnet),
              die neue Miete im System geplant und die E-Mail mit dem PDF im Anhang versendet.
              Die E-Mail erscheint im Ausgang Ihrer Nachrichten.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button onClick={() => setMode("choose")} variant="secondary" disabled={saving}>
            Abbrechen
          </Button>
          <Button
            onClick={() => onSave("email", { subject: emailSubject, body: emailBody + (signature ? "\n\n--\n" + signature : "") })}
            disabled={saving || !emailSubject.trim() || !emailBody.trim()}
            variant="primary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                Senden & speichern
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark mb-1">Finalisieren</h3>
        <p className="text-sm text-gray-500">
          Pr\u00FCfen Sie die Zusammenfassung und w\u00E4hlen Sie, wie Sie das Schreiben zustellen m\u00F6chten.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Mieter</span>
          <span className="font-semibold text-dark">{state.tenantName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Bisherige Nettokaltmiete</span>
          <span className="text-dark">{fmt(state.currentRent)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Neue Nettokaltmiete</span>
          <span className="font-bold text-emerald-700">{fmt(newRent)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Erh\u00F6hung</span>
          <span className="text-emerald-700">+{fmt(newRent - state.currentRent)}</span>
        </div>
        {state.currentUtilities > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Betriebskosten</span>
              <span className="text-dark">{fmt(state.currentUtilities)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
              <span className="text-gray-500 font-medium">Neue Gesamtmiete</span>
              <span className="font-bold text-dark">{fmt(gesamtmiete)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Wirksam ab</span>
          <span className="font-semibold text-dark">{formatDateDE(state.effectiveDate)}</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 mb-2 font-medium">Beim Finalisieren passiert Folgendes:</p>
        <ul className="text-sm text-blue-700 space-y-1.5">
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>PDF wird generiert und als Dokument gespeichert (dem Mieter zugeordnet)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {state.effectiveDate <= new Date().toISOString().split("T")[0]
                ? "Die neue Miete wird sofort im System als aktuelle Miete eingetragen"
                : `Die neue Miete wird als geplant eingetragen und am ${formatDateDE(state.effectiveDate)} automatisch aktiv`}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>VPI-Werte werden f\u00FCr k\u00FCnftige Berechnungen gespeichert</span>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900 mb-1">Wichtiger Hinweis zur Zustellung</p>
            <p className="text-sm text-amber-800 leading-relaxed">
              Die Indexmieterh\u00F6hung muss dem Mieter gem\u00E4\u00DF <span className="font-semibold">\u00A7 126b BGB in Textform</span> zugehen,
              also per E-Mail, Brief oder vergleichbarer lesbarer Erkl\u00E4rung auf einem dauerhaften Datentr\u00E4ger.
              Eine eigenh\u00E4ndige Unterschrift ist nicht zwingend erforderlich.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <Button onClick={() => onSave("download")} disabled={saving} variant="secondary">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Wird erstellt...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-1.5" />
              Downloaden
            </>
          )}
        </Button>
        {state.tenantEmail ? (
          <Button
            onClick={initEmailPreview}
            disabled={saving || !signatureLoaded}
            variant="primary"
          >
            <Mail className="w-4 h-4 mr-1.5" />
            Direkt per E-Mail an Mieter senden
          </Button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg">
            <Mail className="w-4 h-4" />
            <span>Keine E-Mail-Adresse hinterlegt</span>
          </div>
        )}
      </div>
    </div>
  );
}
