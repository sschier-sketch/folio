import { X, Truck, FileText, Clock, DollarSign, Info, Package, AlertCircle } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

interface JobRow {
  id: string;
  external_job_id: number;
  status: string;
  filename_original: string | null;
  recipient_address_text: string | null;
  pages: number | null;
  amount: number | null;
  vat: number | null;
  currency: string;
  shipping: string | null;
  mode: string | null;
  color: string | null;
  c4: number;
  registered: string | null;
  notice: string | null;
  dispatch_date: string | null;
  created_at_provider: string | null;
  updated_at_provider: string | null;
  item_status: string | null;
  tracking_code: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  last_synced_at: string | null;
  is_cancelable: boolean;
  canceled_at: string | null;
  created_at: string;
  raw_payload_json: any;
}

interface Props {
  job: JobRow;
  onClose: () => void;
}

function fmt(iso: string | null, lang: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString(lang === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    queue: ["Warteschlange", "Queue"],
    hold: ["Pausiert", "On Hold"],
    done: ["Verarbeitet", "Done"],
    canceled: ["Storniert", "Canceled"],
    draft: ["Entwurf", "Draft"],
    sent: ["Versendet", "Sent"],
    error: ["Fehler", "Error"],
    unknown: ["Unbekannt", "Unknown"],
  };
  const entry = map[status];
  return entry ? entry[de ? 0 : 1] : status;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "-" || value === "") return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 mr-4">{label}</span>
      <span className="text-sm text-gray-900 text-right break-all">{value}</span>
    </div>
  );
}

export default function PostalMailJobDetail({ job, onClose }: Props) {
  const { language } = useLanguage();
  const de = language === "de";

  const shippingLabel = (s: string | null) => {
    if (!s) return "-";
    const m: Record<string, string> = { national: "National", international: "International", auto: "Automatisch" };
    return m[s] || s;
  };

  const colorLabel = (c: string | null) => {
    if (!c) return "-";
    return c === "4" ? (de ? "Farbe" : "Color") : (de ? "Schwarz/Wei\u00df" : "B&W");
  };

  const modeLabel = (m: string | null) => {
    if (!m) return "-";
    return m === "duplex" ? "Duplex" : "Simplex";
  };

  const registeredLabel = (r: string | null) => {
    if (!r) return de ? "Nein" : "No";
    const m: Record<string, string> = { r1: de ? "Einschreiben" : "Registered", r2: de ? "Einwurf-Einschreiben" : "Registered (drop-off)" };
    return m[r] || r;
  };

  const items = job.raw_payload_json?.items;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-dark">
                {de ? "Auftragsdetails" : "Job Details"}
              </h3>
              <p className="text-xs text-gray-400">
                Job #{job.external_job_id}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-dark uppercase tracking-wide">
                {de ? "Allgemein" : "General"}
              </h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Row label="LetterXpress Job-ID" value={job.external_job_id} />
              <Row label="Status" value={statusLabel(job.status, de)} />
              <Row label={de ? "Item-Status" : "Item Status"} value={job.item_status ? statusLabel(job.item_status, de) : null} />
              <Row label={de ? "Dateiname" : "Filename"} value={job.filename_original} />
              <Row label={de ? "Empf\u00e4nger" : "Recipient"} value={job.recipient_address_text} />
              <Row label={de ? "Notiz" : "Notice"} value={job.notice} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-dark uppercase tracking-wide">
                {de ? "Versand & Druck" : "Shipping & Print"}
              </h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Row label={de ? "Versandart" : "Shipping"} value={shippingLabel(job.shipping)} />
              <Row label={de ? "Druckmodus" : "Print Mode"} value={modeLabel(job.mode)} />
              <Row label={de ? "Farbe" : "Color"} value={colorLabel(job.color)} />
              <Row label="C4" value={job.c4 ? (de ? "Ja" : "Yes") : (de ? "Nein" : "No")} />
              <Row label={de ? "Einschreiben" : "Registered"} value={registeredLabel(job.registered)} />
              <Row label={de ? "Versanddatum" : "Dispatch Date"} value={job.dispatch_date || (de ? "Nicht geplant" : "Not scheduled")} />
              <Row label={de ? "Tracking-Code" : "Tracking Code"} value={job.tracking_code} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-dark uppercase tracking-wide">
                {de ? "Kosten" : "Costs"}
              </h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Row label={de ? "Seiten" : "Pages"} value={job.pages} />
              <Row label={de ? "Betrag (netto)" : "Amount (net)"} value={job.amount != null ? `${job.amount.toFixed(2)} ${job.currency}` : null} />
              <Row label={de ? "MwSt." : "VAT"} value={job.vat != null ? `${job.vat.toFixed(2)} ${job.currency}` : null} />
              <Row
                label={de ? "Gesamt (brutto)" : "Total (gross)"}
                value={
                  job.amount != null && job.vat != null
                    ? `${(Number(job.amount) + Number(job.vat)).toFixed(2)} ${job.currency}`
                    : null
                }
              />
            </div>
          </div>

          {items && items.length > 1 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold text-dark uppercase tracking-wide">
                  {de ? "Alle Positionen" : "All Items"} ({items.length})
                </h4>
              </div>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                {items.map((item: any, i: number) => (
                  <div key={i} className="p-4">
                    <Row label={de ? "Adresse" : "Address"} value={item.address} />
                    <Row label={de ? "Seiten" : "Pages"} value={item.pages} />
                    <Row label={de ? "Betrag" : "Amount"} value={item.amount != null ? `${item.amount.toFixed(2)} EUR` : null} />
                    <Row label="Status" value={item.status ? statusLabel(item.status, de) : null} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-dark uppercase tracking-wide">
                {de ? "Zeitstempel" : "Timestamps"}
              </h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Row label={de ? "Erstellt (Provider)" : "Created (Provider)"} value={fmt(job.created_at_provider, language)} />
              <Row label={de ? "Aktualisiert (Provider)" : "Updated (Provider)"} value={fmt(job.updated_at_provider, language)} />
              <Row label={de ? "Letzte Synchronisierung" : "Last Sync"} value={fmt(job.last_synced_at, language)} />
              <Row label={de ? "Storniert am" : "Canceled at"} value={job.canceled_at ? fmt(job.canceled_at, language) : null} />
              <Row label={de ? "Stornierbar" : "Cancelable"} value={job.is_cancelable ? (de ? "Ja" : "Yes") : (de ? "Nein" : "No")} />
            </div>
          </div>

          {(job.last_error_code || job.last_error_message) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                  {de ? "Letzte Fehlermeldung" : "Last Error"}
                </h4>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <Row label={de ? "Fehlercode" : "Error Code"} value={job.last_error_code} />
                <Row label={de ? "Fehlermeldung" : "Error Message"} value={job.last_error_message} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
