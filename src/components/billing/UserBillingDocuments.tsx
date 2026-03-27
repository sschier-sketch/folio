import { useState, useEffect } from "react";
import { FileText, Download, Loader2, Receipt, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useSubscription } from "../../hooks/useSubscription";
import { useLanguage } from "../../contexts/LanguageContext";

interface BillingDocument {
  id: string;
  type: "invoice" | "credit_note";
  stripeId: string;
  number: string | null;
  status: string;
  date: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  hasPdf: boolean;
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency || "eur",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(status: string, type: string, lang: string): { text: string; color: string } {
  if (type === "credit_note") {
    if (status === "issued") return { text: lang === "de" ? "Ausgestellt" : "Issued", color: "bg-emerald-50 text-emerald-700" };
    if (status === "void") return { text: lang === "de" ? "Storniert" : "Void", color: "bg-gray-100 text-gray-500" };
    return { text: status, color: "bg-gray-100 text-gray-500" };
  }
  if (status === "paid") return { text: lang === "de" ? "Bezahlt" : "Paid", color: "bg-emerald-50 text-emerald-700" };
  if (status === "open") return { text: lang === "de" ? "Offen" : "Open", color: "bg-amber-50 text-amber-700" };
  if (status === "void") return { text: lang === "de" ? "Storniert" : "Void", color: "bg-gray-100 text-gray-500" };
  if (status === "uncollectible") return { text: lang === "de" ? "Uneinbringlich" : "Uncollectible", color: "bg-red-50 text-red-600" };
  return { text: status, color: "bg-gray-100 text-gray-500" };
}

export default function UserBillingDocuments() {
  const { language } = useLanguage();
  const { billingInfo } = useSubscription();
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const customerId = billingInfo?.stripe_customer_id;

  useEffect(() => {
    if (customerId) {
      loadDocuments();
    } else {
      setLoading(false);
    }
  }, [customerId]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const [invoicesRes, creditNotesRes] = await Promise.all([
        supabase
          .from("stripe_invoices")
          .select("id, stripe_invoice_id, invoice_number, status, currency, total, tax, subtotal, created_at_stripe, pdf_storage_path, hosted_invoice_url")
          .eq("stripe_customer_id", customerId!)
          .in("status", ["paid", "open", "void", "uncollectible"])
          .order("created_at_stripe", { ascending: false }),
        supabase
          .from("stripe_credit_notes")
          .select("id, stripe_credit_note_id, number, status, currency, total, tax, subtotal, created_at_stripe, pdf_storage_path, pdf_url")
          .eq("stripe_customer_id", customerId!)
          .order("created_at_stripe", { ascending: false }),
      ]);

      const invoiceDocs: BillingDocument[] = (invoicesRes.data || []).map((inv) => ({
        id: inv.id,
        type: "invoice",
        stripeId: inv.stripe_invoice_id,
        number: inv.invoice_number,
        status: inv.status,
        date: inv.created_at_stripe,
        subtotal: inv.subtotal ?? inv.total,
        tax: inv.tax ?? 0,
        total: inv.total,
        currency: inv.currency,
        hasPdf: !!(inv.pdf_storage_path || inv.hosted_invoice_url),
      }));

      const creditDocs: BillingDocument[] = (creditNotesRes.data || []).map((cn) => ({
        id: cn.id,
        type: "credit_note",
        stripeId: cn.stripe_credit_note_id,
        number: cn.number,
        status: cn.status,
        date: cn.created_at_stripe,
        subtotal: cn.subtotal ?? cn.total,
        tax: cn.tax ?? 0,
        total: cn.total,
        currency: cn.currency,
        hasPdf: !!(cn.pdf_storage_path || cn.pdf_url),
      }));

      const all = [...invoiceDocs, ...creditDocs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setDocuments(all);
    } catch (err) {
      console.error("Failed to load billing documents:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(doc: BillingDocument) {
    setDownloadingId(doc.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fnName = doc.type === "invoice" ? "get-invoice-pdf" : "get-credit-note-pdf";
      const paramName = doc.type === "invoice" ? "invoice_id" : "credit_note_id";
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL || "https://mypuvkzsgwanilduniup.supabase.co"}/functions/v1/${fnName}?${paramName}=${doc.stripeId}`;

      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("PDF not available");

      const { url } = await res.json();
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  }

  if (!customerId && !loading) {
    return null;
  }

  return (
    <div className="bg-white rounded shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {language === "de" ? "Rechnungen & Belege" : "Invoices & Receipts"}
          </h2>
          <p className="text-sm text-gray-500">
            {language === "de"
              ? "Alle Rechnungen und Gutschriften zu Ihrem Abonnement"
              : "All invoices and credit notes for your subscription"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {language === "de"
              ? "Noch keine Belege vorhanden."
              : "No documents available yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                  {language === "de" ? "Datum" : "Date"}
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">
                  {language === "de" ? "Typ" : "Type"}
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">
                  {language === "de" ? "Nummer" : "Number"}
                </th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">
                  Netto
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">
                  {language === "de" ? "Steuer" : "Tax"}
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">
                  Brutto
                </th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((doc) => {
                const sl = statusLabel(doc.status, doc.type, language);
                const isCreditNote = doc.type === "credit_note";
                return (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(doc.date)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {isCreditNote ? (
                          <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-600">
                          {isCreditNote
                            ? (language === "de" ? "Gutschrift" : "Credit Note")
                            : (language === "de" ? "Rechnung" : "Invoice")}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700 font-mono whitespace-nowrap">
                      {doc.number || "-"}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${sl.color}`}>
                        {sl.text}
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-sm text-right whitespace-nowrap ${isCreditNote ? "text-red-600" : "text-gray-700"}`}>
                      {isCreditNote ? "-" : ""}{formatCents(doc.subtotal, doc.currency)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right whitespace-nowrap ${isCreditNote ? "text-red-600" : "text-gray-700"}`}>
                      {isCreditNote ? "-" : ""}{formatCents(doc.tax, doc.currency)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right font-medium whitespace-nowrap ${isCreditNote ? "text-red-600" : "text-gray-900"}`}>
                      {isCreditNote ? "-" : ""}{formatCents(doc.total, doc.currency)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {doc.hasPdf ? (
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                          title={language === "de" ? "PDF herunterladen" : "Download PDF"}
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-300">
                          <AlertCircle className="w-4 h-4 inline" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
