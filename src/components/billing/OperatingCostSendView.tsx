import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, X, Paperclip, Eye, Send, AlertCircle } from "lucide-react";
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

export default function OperatingCostSendView() {
  const { id: statementId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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
      navigate(-1);
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
        navigate(`/abrechnungen/betriebskosten/${statementId}/versand`);
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
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-dark">E-Mail Vorschau</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 text-gray-600 hover:text-dark transition-colors"
            >
              Schließen
            </button>
          </div>

          {enabledRecipients.length > 1 && (
            <div className="mb-4">
              <label className="text-sm text-gray-600">Empfänger auswählen:</label>
              <select
                value={previewRecipientIndex}
                onChange={(e) => setPreviewRecipientIndex(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                {enabledRecipients.map((recipient, index) => (
                  <option key={recipient.id} value={index}>
                    {recipient.tenantName} ({recipient.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Betreff:</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg text-dark">{previewSubject}</div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Nachricht:</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg text-dark whitespace-pre-wrap">
                {previewMessage}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-dark transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark">Betriebskostenabrechnung senden</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-600 hover:text-dark transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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
                  Senden
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Kanal</h3>
            <div className="flex items-center gap-3 p-4 border-2 border-primary-blue bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-primary-blue" />
              <div>
                <div className="font-medium text-dark">E-Mail</div>
                <div className="text-sm text-gray-600">Per E-Mail senden</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Empfänger</h3>
              <span className="text-sm text-gray-500">
                {enabledRecipients.length} von {recipients.length}
              </span>
            </div>

            {recipientsWithoutEmail.length > 0 && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  {recipientsWithoutEmail.length} Empfänger ohne E-Mail können nicht per E-Mail kontaktiert werden.
                </div>
              </div>
            )}

            <div className="space-y-2">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    recipient.enabled
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-primary-blue font-medium">
                      {recipient.tenantName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-dark">{recipient.tenantName}</div>
                      <div className="text-sm text-gray-600">
                        {recipient.email || "E-Mail fehlt"}
                        {recipient.unitNumber && ` • ${recipient.unitNumber}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeRecipient(recipient.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Betreff</h3>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="Betreff der E-Mail"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Nachricht</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-mono text-sm"
              placeholder="E-Mail-Nachricht mit Platzhaltern"
            />
            <div className="mt-2 text-xs text-gray-500">
              Verfügbare Platzhalter: {"{{mieter_name}}, {{immobilie}}, {{einheit}}, {{jahr}}, {{betrag_nachzahlung_oder_guthaben}}, {{faelligkeit_datum}}, {{iban}}, {{vermieter_name}}"}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Anhänge ({recipients.length})</h3>
            <div className="space-y-2">
              {recipients.slice(0, 3).map((recipient) => (
                <div key={recipient.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 text-sm text-gray-700 truncate">
                    Abrechnung_{recipient.tenantName.replace(/\s+/g, "_")}.pdf
                  </div>
                </div>
              ))}
              {recipients.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{recipients.length - 3} weitere
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Mieterportal</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInPortal}
                onChange={(e) => setIncludeInPortal(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
              />
              <div>
                <div className="text-sm text-dark">Zusätzlich im Mieterportal bereitstellen</div>
                <div className="text-xs text-gray-500 mt-1">
                  Der Mieter sieht die Abrechnung im Portal unter Dokumente/Abrechnungen.
                </div>
              </div>
            </label>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-dark mb-2">Tipps</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Vorlagen nutzen für schnelles Schreiben</li>
              <li>• Platzhalter werden automatisch ersetzt</li>
              <li>• E-Mails werden im Postausgang archiviert</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
