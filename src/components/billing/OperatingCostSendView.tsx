import { useState, useEffect } from "react";
import { ArrowLeft, Mail, X, Paperclip, Eye, Send, AlertCircle, Check } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { operatingCostService, OperatingCostStatement } from "../../lib/operatingCostService";

interface Recipient {
  id: string;
  tenantId: string;
  tenantName: string;
  email: string | null;
  unitNumber: string | null;
  balance: number;
  resultId: string;
  enabled: boolean;
}

interface OperatingCostSendViewProps {
  statementId: string;
  onBack: () => void;
}

export default function OperatingCostSendView({ statementId, onBack }: OperatingCostSendViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statement, setStatement] = useState<OperatingCostStatement | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [includeInPortal, setIncludeInPortal] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRecipientIndex, setPreviewRecipientIndex] = useState(0);
  const [propertyName, setPropertyName] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [bankIban, setBankIban] = useState("");

  useEffect(() => {
    if (statementId && user) {
      loadData();
    }
  }, [statementId, user]);

  async function loadData() {
    if (!statementId || !user) return;

    try {
      const { statement: stmt, error: stmtError } = await operatingCostService.getStatementDetail(statementId);
      if (stmtError) throw stmtError;
      if (!stmt) throw new Error("Statement not found");

      setStatement(stmt);

      const { data: property } = await supabase
        .from("properties")
        .select("name")
        .eq("id", stmt.property_id)
        .single();

      if (property) {
        setPropertyName(property.name);
      }

      const { data: profile } = await supabase
        .from("account_profiles")
        .select("first_name, last_name, company_name")
        .eq("user_id", user.id)
        .single();

      const landlordFullName = profile?.company_name ||
        (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "Ihr Vermieter");
      setLandlordName(landlordFullName);

      const { data: bankDetails } = await supabase
        .from("user_bank_details")
        .select("iban")
        .eq("user_id", user.id)
        .single();

      if (bankDetails?.iban) {
        setBankIban(bankDetails.iban);
      }

      const { data: results } = await supabase
        .from("operating_cost_results")
        .select(`
          id,
          tenant_id,
          unit_id,
          balance,
          tenants (
            first_name,
            last_name,
            email
          ),
          property_units (
            unit_number
          )
        `)
        .eq("statement_id", statementId);

      if (results) {
        const recipientsList: Recipient[] = results
          .filter((r) => r.tenant_id)
          .map((r) => {
            const tenant = r.tenants as any;
            const unit = r.property_units as any;
            const hasEmail = tenant?.email && tenant.email.trim().length > 0;

            return {
              id: r.id,
              tenantId: r.tenant_id!,
              tenantName: tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unbekannt",
              email: tenant?.email || null,
              unitNumber: unit?.unit_number || null,
              balance: Number(r.balance),
              resultId: r.id,
              enabled: hasEmail,
            };
          });

        setRecipients(recipientsList);
      }

      setSubject(`Nebenkostenabrechnung ${stmt.year}`);
      setMessage(getDefaultMessage());
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Fehler beim Laden der Daten");
      onBack();
    } finally {
      setLoading(false);
    }
  }

  function getDefaultMessage() {
    return `Hallo {{mieter_name}},

anbei erhalten Sie die Nebenkostenabrechnung für das Jahr {{jahr}} für die Immobilie {{immobilie}}, Einheit {{einheit}}.

Ergebnis: {{betrag_nachzahlung_oder_guthaben}}

Fälligkeitsdatum: {{faelligkeit_datum}}

Bei Nachzahlungen überweisen Sie bitte den Betrag auf folgendes Konto:
IBAN: {{iban}}

Bei Rückfragen können Sie sich gerne über das Mieterportal oder per E-Mail bei uns melden.

Mit freundlichen Grüßen
{{vermieter_name}}`;
  }

  function removeRecipient(recipientId: string) {
    setRecipients(recipients.filter((r) => r.id !== recipientId));
  }

  function replacePlaceholders(text: string, recipient: Recipient): string {
    const balanceText = recipient.balance >= 0
      ? `Nachzahlung von ${recipient.balance.toFixed(2)} €`
      : `Guthaben von ${Math.abs(recipient.balance).toFixed(2)} €`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toLocaleDateString("de-DE");

    return text
      .replace(/\{\{mieter_name\}\}/g, recipient.tenantName)
      .replace(/\{\{immobilie\}\}/g, propertyName || "")
      .replace(/\{\{einheit\}\}/g, recipient.unitNumber || "-")
      .replace(/\{\{jahr\}\}/g, statement?.year.toString() || "")
      .replace(/\{\{betrag_nachzahlung_oder_guthaben\}\}/g, balanceText)
      .replace(/\{\{faelligkeit_datum\}\}/g, dueDateStr)
      .replace(/\{\{iban\}\}/g, bankIban || "Bitte IBAN hinterlegen")
      .replace(/\{\{vermieter_name\}\}/g, landlordName);
  }

  async function handleSend() {
    const enabledRecipients = recipients.filter((r) => r.enabled && r.email);

    if (enabledRecipients.length === 0) {
      alert("Bitte wählen Sie mindestens einen Empfänger mit gültiger E-Mail-Adresse aus.");
      return;
    }

    if (!subject.trim()) {
      alert("Bitte geben Sie einen Betreff ein.");
      return;
    }

    if (!message.trim()) {
      alert("Bitte geben Sie eine Nachricht ein.");
      return;
    }

    if (!confirm(`Möchten Sie die Abrechnung an ${enabledRecipients.length} Empfänger versenden?`)) {
      return;
    }

    setSending(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const recipient of enabledRecipients) {
        const personalizedSubject = replacePlaceholders(subject, recipient);
        const personalizedMessage = replacePlaceholders(message, recipient);

        const { data: pdfData } = await supabase
          .from("operating_cost_pdfs")
          .select("id, file_path")
          .eq("result_id", recipient.resultId)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!pdfData?.file_path) {
          console.warn(`No PDF found for recipient ${recipient.tenantName}`);

          await supabase.from("operating_cost_send_logs").insert({
            statement_id: statementId,
            tenant_id: recipient.tenantId,
            email: recipient.email,
            status: "failed",
            error_message: "PDF nicht gefunden",
          });

          errorCount++;
          continue;
        }

        const { error: sendError } = await supabase.functions.invoke("send-email", {
          body: {
            to: recipient.email,
            subject: personalizedSubject,
            html: personalizedMessage.replace(/\n/g, "<br>"),
            mailType: "operating_cost_statement",
            userId: user!.id,
            attachments: [
              {
                filename: `Betriebskostenabrechnung_${statement?.year}_${recipient.tenantName.replace(/\s+/g, "_")}.pdf`,
                path: pdfData.file_path,
              },
            ],
          },
        });

        if (sendError) {
          console.error(`Error sending to ${recipient.email}:`, sendError);

          await supabase.from("operating_cost_send_logs").insert({
            statement_id: statementId,
            tenant_id: recipient.tenantId,
            email: recipient.email,
            status: "failed",
            error_message: sendError.message || "Fehler beim Versenden",
          });

          errorCount++;
        } else {
          successCount++;

          await supabase.from("operating_cost_send_logs").insert({
            statement_id: statementId,
            tenant_id: recipient.tenantId,
            email: recipient.email,
            status: "success",
          });

          if (includeInPortal) {
            await supabase.from("property_documents").insert({
              user_id: user!.id,
              property_id: statement!.property_id,
              unit_id: recipient.unitNumber ? undefined : null,
              title: `Nebenkostenabrechnung ${statement?.year}`,
              description: `Betriebskostenabrechnung für das Jahr ${statement?.year}`,
              file_path: pdfData.file_path,
              file_type: "application/pdf",
              document_type: "betriebskostenabrechnung",
              shared_with_tenant: true,
            });
          }
        }
      }

      if (successCount > 0) {
        await operatingCostService.updateStatementStatus(statementId!, "sent");
      }

      if (errorCount === 0) {
        alert(`Alle ${successCount} Abrechnungen wurden erfolgreich versendet.`);
        onBack();
      } else {
        alert(`${successCount} Abrechnungen versendet, ${errorCount} fehlgeschlagen.`);
      }
    } catch (error) {
      console.error("Error sending:", error);
      alert("Fehler beim Versenden der Abrechnungen");
    } finally {
      setSending(false);
    }
  }

  const enabledRecipients = recipients.filter((r) => r.enabled && r.email);
  const recipientsWithoutEmail = recipients.filter((r) => !r.email);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showPreview) {
    const previewRecipient = enabledRecipients[previewRecipientIndex];
    const previewSubject = previewRecipient ? replacePlaceholders(subject, previewRecipient) : subject;
    const previewMessage = previewRecipient ? replacePlaceholders(message, previewRecipient) : message;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-dark transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück zur Bearbeitung
            </button>
            <h2 className="text-2xl font-bold text-dark">E-Mail Vorschau</h2>
            <p className="text-gray-400 mt-1">So sieht die E-Mail für Ihre Mieter aus</p>
          </div>
        </div>

        {enabledRecipients.length > 1 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vorschau für Empfänger:
            </label>
            <select
              value={previewRecipientIndex}
              onChange={(e) => setPreviewRecipientIndex(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-dark"
            >
              {enabledRecipients.map((recipient, index) => (
                <option key={recipient.id} value={index}>
                  {recipient.tenantName} ({recipient.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Betreff:</label>
            <div className="p-4 bg-gray-50 rounded-lg text-dark">{previewSubject}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nachricht:</label>
            <div className="p-4 bg-gray-50 rounded-lg text-dark whitespace-pre-wrap">
              {previewMessage}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Anhang:</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">
                Betriebskostenabrechnung_{statement?.year}_{previewRecipient?.tenantName.replace(/\s+/g, "_")}.pdf
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-dark transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Übersicht
          </button>
          <h2 className="text-2xl font-bold text-dark">
            Betriebskostenabrechnung senden
          </h2>
          <p className="text-gray-400 mt-1">
            Senden Sie die Abrechnung per E-Mail an Ihre Mieter
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={enabledRecipients.length === 0}
          >
            <Eye className="w-4 h-4" />
            Vorschau
          </button>
          <button
            onClick={handleSend}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={enabledRecipients.length === 0 || sending}
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Senden ({enabledRecipients.length})
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Mail className="w-5 h-5 text-primary-blue" />
          <h3 className="text-lg font-semibold text-dark">Versandkanal</h3>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-medium text-dark">E-Mail</div>
              <div className="text-sm text-gray-600">Versand per E-Mail mit PDF-Anhang</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark">
            Empfänger ({enabledRecipients.length} von {recipients.length})
          </h3>
        </div>

        {recipientsWithoutEmail.length > 0 && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              {recipientsWithoutEmail.length} Empfänger ohne E-Mail-Adresse können nicht kontaktiert werden.
            </div>
          </div>
        )}

        <div className="space-y-2">
          {recipients.map((recipient) => (
            <div
              key={recipient.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                recipient.enabled
                  ? "bg-white border-gray-200"
                  : "bg-gray-50 border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-primary-blue font-semibold">
                  {recipient.tenantName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-dark">{recipient.tenantName}</div>
                  <div className="text-sm text-gray-600">
                    {recipient.email || (
                      <span className="text-red-600">E-Mail fehlt</span>
                    )}
                    {recipient.unitNumber && ` • ${recipient.unitNumber}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeRecipient(recipient.id)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-dark mb-4">Betreff</h3>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-dark"
          placeholder="Betreff der E-Mail"
        />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-dark mb-2">Nachricht</h3>
        <p className="text-sm text-gray-600 mb-4">
          Verfügbare Platzhalter: {"{"}
          {"{"}mieter_name{"}"}, {"{"}immobilie{"}"}, {"{"}einheit{"}"}, {"{"}jahr{"}"}, {"{"}betrag_nachzahlung_oder_guthaben{"}"}, {"{"}faelligkeit_datum{"}"}, {"{"}iban{"}"}, {"{"}vermieter_name{"}"}
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-mono text-sm text-dark"
          placeholder="E-Mail-Nachricht mit Platzhaltern"
        />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-dark mb-4">Weitere Optionen</h3>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={includeInPortal}
                onChange={(e) => setIncludeInPortal(e.target.checked)}
                className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
              />
            </div>
            <div className="flex-1">
              <div className="font-medium text-dark">Im Mieterportal bereitstellen</div>
              <div className="text-sm text-gray-600 mt-1">
                Die Abrechnung wird zusätzlich im Mieterportal unter Dokumente angezeigt
              </div>
            </div>
          </label>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Anhänge ({recipients.length})
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Pro Empfänger wird automatisch die passende PDF angehängt
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
