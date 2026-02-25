import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Send,
  Pencil,
  Trash2,
  Eye,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  X,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  audience_filter: AudienceFilter;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AudienceFilter {
  plan?: "all" | "free" | "pro" | "trial";
  has_newsletter?: boolean;
  registered_before?: string;
  registered_after?: string;
}

interface EmailTemplate {
  template_key: string;
  template_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  language: string;
}

type ViewMode = "list" | "create" | "edit" | "preview";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  draft: { label: "Entwurf", color: "bg-gray-100 text-gray-600", icon: Pencil },
  scheduled: {
    label: "Geplant",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  sending: {
    label: "Wird gesendet",
    color: "bg-blue-100 text-blue-700",
    icon: Loader2,
  },
  sent: {
    label: "Gesendet",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Abgebrochen",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

const EMPTY_CAMPAIGN: Omit<Campaign, "id" | "created_at" | "updated_at" | "created_by"> = {
  name: "",
  subject: "",
  body_html: "",
  body_text: "",
  audience_filter: { plan: "all" },
  status: "draft",
  scheduled_at: null,
  sent_at: null,
  total_recipients: 0,
  sent_count: 0,
  failed_count: 0,
};

export default function AdminEmailCampaignsView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editCampaign, setEditCampaign] = useState<Partial<Campaign>>(EMPTY_CAMPAIGN);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
  }, []);

  async function loadCampaigns() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error("Error loading campaigns:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    try {
      const { data } = await supabase
        .from("email_templates")
        .select("template_key, template_name, subject, body_html, body_text, language")
        .eq("language", "de")
        .order("template_name");
      setTemplates(data || []);
    } catch (err) {
      console.error("Error loading templates:", err);
    }
  }

  async function countRecipients(filter: AudienceFilter) {
    try {
      setCountLoading(true);
      const { data, error } = await supabase.rpc("admin_get_users");
      if (error) throw error;
      const users = (data || []) as any[];
      const filtered = filterUsers(users, filter);
      setRecipientCount(filtered.length);
    } catch (err) {
      console.error("Error counting recipients:", err);
      setRecipientCount(null);
    } finally {
      setCountLoading(false);
    }
  }

  function filterUsers(users: any[], filter: AudienceFilter) {
    return users.filter((u) => {
      if (filter.plan && filter.plan !== "all") {
        if (filter.plan === "pro" && u.subscription_plan !== "pro") return false;
        if (filter.plan === "free" && u.subscription_plan === "pro") return false;
        if (filter.plan === "trial") {
          if (!u.trial_ends_at || new Date(u.trial_ends_at) <= new Date())
            return false;
        }
      }
      if (filter.has_newsletter === true && !u.newsletter_opt_in) return false;
      if (
        filter.registered_after &&
        new Date(u.created_at) < new Date(filter.registered_after)
      )
        return false;
      if (
        filter.registered_before &&
        new Date(u.created_at) > new Date(filter.registered_before)
      )
        return false;
      return true;
    });
  }

  async function saveCampaign() {
    try {
      setSaving(true);
      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (editCampaign.id) {
        const { error } = await supabase
          .from("email_campaigns")
          .update({
            name: editCampaign.name,
            subject: editCampaign.subject,
            body_html: editCampaign.body_html,
            body_text: editCampaign.body_text,
            audience_filter: editCampaign.audience_filter,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("email_campaigns").insert({
          name: editCampaign.name,
          subject: editCampaign.subject,
          body_html: editCampaign.body_html,
          body_text: editCampaign.body_text,
          audience_filter: editCampaign.audience_filter,
          status: "draft",
          created_by: userId,
        });
        if (error) throw error;
      }

      await loadCampaigns();
      setViewMode("list");
      setEditCampaign(EMPTY_CAMPAIGN);
    } catch (err) {
      console.error("Error saving campaign:", err);
      alert("Fehler beim Speichern der Kampagne");
    } finally {
      setSaving(false);
    }
  }

  async function sendCampaign(campaign: Campaign) {
    if (
      !confirm(
        `Kampagne "${campaign.name}" jetzt an alle Empfaenger senden? Dieser Vorgang kann nicht rueckgaengig gemacht werden.`
      )
    )
      return;

    try {
      setSending(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Nicht eingeloggt");

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-campaign`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignId: campaign.id }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Fehler beim Senden");

      alert(
        `Kampagne gesendet: ${result.sent} von ${result.total} E-Mails erfolgreich`
      );
      await loadCampaigns();
    } catch (err: any) {
      console.error("Error sending campaign:", err);
      alert(err.message || "Fehler beim Senden der Kampagne");
    } finally {
      setSending(false);
    }
  }

  async function deleteCampaign(campaign: Campaign) {
    if (!confirm(`Kampagne "${campaign.name}" wirklich loeschen?`)) return;
    try {
      const { error } = await supabase
        .from("email_campaigns")
        .delete()
        .eq("id", campaign.id);
      if (error) throw error;
      await loadCampaigns();
    } catch (err) {
      console.error("Error deleting campaign:", err);
    }
  }

  function startCreate() {
    setEditCampaign({ ...EMPTY_CAMPAIGN });
    setRecipientCount(null);
    setViewMode("create");
  }

  function startEdit(campaign: Campaign) {
    setEditCampaign({ ...campaign });
    setRecipientCount(null);
    setViewMode("edit");
  }

  function openPreview(campaign: Campaign) {
    setPreviewHtml(campaign.body_html);
    setViewMode("preview");
  }

  function loadFromTemplate(template: EmailTemplate) {
    setEditCampaign({
      ...editCampaign,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
    });
  }

  function duplicateCampaign(campaign: Campaign) {
    setEditCampaign({
      ...EMPTY_CAMPAIGN,
      name: `${campaign.name} (Kopie)`,
      subject: campaign.subject,
      body_html: campaign.body_html,
      body_text: campaign.body_text,
      audience_filter: { ...campaign.audience_filter },
    });
    setRecipientCount(null);
    setViewMode("create");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (viewMode === "preview") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode("list")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-dark">E-Mail Vorschau</h2>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-4 bg-gray-50">
            <p className="text-xs text-gray-500">HTML-Vorschau</p>
          </div>
          <div className="p-6">
            <div
              className="max-w-[600px] mx-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <CampaignEditor
        campaign={editCampaign}
        onChange={setEditCampaign}
        onSave={saveCampaign}
        onCancel={() => {
          setViewMode("list");
          setEditCampaign(EMPTY_CAMPAIGN);
        }}
        saving={saving}
        isEdit={viewMode === "edit"}
        templates={templates}
        onLoadTemplate={loadFromTemplate}
        recipientCount={recipientCount}
        countLoading={countLoading}
        onCountRecipients={() =>
          countRecipients(editCampaign.audience_filter || { plan: "all" })
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-dark">E-Mail Kampagnen</h2>
          <p className="text-sm text-gray-400 mt-1">
            Erstelle und versende E-Mail-Kampagnen an ausgewaehlte
            Nutzersegmente
          </p>
        </div>
        <Button onClick={startCreate} variant="primary">
          <Plus className="w-4 h-4 mr-1.5" />
          Neue Kampagne
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Send className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 mb-4">
            Noch keine Kampagnen erstellt
          </p>
          <Button onClick={startCreate} variant="primary">
            <Plus className="w-4 h-4 mr-1.5" />
            Erste Kampagne erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const statusConf =
              STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusConf.icon;

            return (
              <div
                key={campaign.id}
                className="bg-white rounded-xl border border-gray-100 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-dark text-sm truncate">
                        {campaign.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConf.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConf.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2 truncate">
                      Betreff: {campaign.subject || "(kein Betreff)"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {formatAudienceShort(campaign.audience_filter)}
                      </span>
                      {campaign.status === "sent" && (
                        <>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            {campaign.sent_count} gesendet
                          </span>
                          {campaign.failed_count > 0 && (
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="w-3.5 h-3.5" />
                              {campaign.failed_count} fehlgeschlagen
                            </span>
                          )}
                        </>
                      )}
                      <span>
                        {new Date(campaign.created_at).toLocaleDateString(
                          "de-DE",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {campaign.body_html && (
                      <button
                        onClick={() => openPreview(campaign)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Vorschau"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    <button
                      onClick={() => duplicateCampaign(campaign)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Duplizieren"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                    {campaign.status === "draft" && (
                      <>
                        <button
                          onClick={() => startEdit(campaign)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => sendCampaign(campaign)}
                          disabled={
                            sending || !campaign.subject || !campaign.body_html
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Jetzt senden"
                        >
                          {sending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Senden
                        </button>
                        <button
                          onClick={() => deleteCampaign(campaign)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Loeschen"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CampaignEditor({
  campaign,
  onChange,
  onSave,
  onCancel,
  saving,
  isEdit,
  templates,
  onLoadTemplate,
  recipientCount,
  countLoading,
  onCountRecipients,
}: {
  campaign: Partial<Campaign>;
  onChange: (c: Partial<Campaign>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
  templates: EmailTemplate[];
  onLoadTemplate: (t: EmailTemplate) => void;
  recipientCount: number | null;
  countLoading: boolean;
  onCountRecipients: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"content" | "audience" | "preview">("content");
  const filter = campaign.audience_filter || {};

  const canSave = !!(campaign.name?.trim() && campaign.subject?.trim());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-dark">
            {isEdit ? "Kampagne bearbeiten" : "Neue Kampagne"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onCancel} variant="secondary">
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={saving || !canSave} variant="primary">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Speichern...
              </>
            ) : (
              "Speichern"
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {(
          [
            ["content", "Inhalt"],
            ["audience", "Zielgruppe"],
            ["preview", "Vorschau"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "content" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Kampagnen-Name (intern)
            </label>
            <input
              type="text"
              value={campaign.name || ""}
              onChange={(e) => onChange({ ...campaign, name: e.target.value })}
              placeholder="z.B. Februar Newsletter"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              E-Mail Betreff
            </label>
            <input
              type="text"
              value={campaign.subject || ""}
              onChange={(e) =>
                onChange({ ...campaign, subject: e.target.value })
              }
              placeholder="Betreffzeile der E-Mail"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {templates.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Aus Template laden (optional)
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const t = templates.find(
                    (t) => t.template_key === e.target.value
                  );
                  if (t) onLoadTemplate(t);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Template auswaehlen --</option>
                {templates.map((t) => (
                  <option key={t.template_key} value={t.template_key}>
                    {t.template_name} ({t.template_key})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              HTML Inhalt
            </label>
            <textarea
              value={campaign.body_html || ""}
              onChange={(e) =>
                onChange({ ...campaign, body_html: e.target.value })
              }
              rows={16}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
              placeholder="HTML-Code der E-Mail..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Text Version (Plain Text)
            </label>
            <textarea
              value={campaign.body_text || ""}
              onChange={(e) =>
                onChange({ ...campaign, body_text: e.target.value })
              }
              rows={6}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
              placeholder="Klartext-Version fuer E-Mail-Clients ohne HTML..."
            />
          </div>
        </div>
      )}

      {activeTab === "audience" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
            <Users className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Definiere hier, an welche Nutzer die Kampagne gesendet werden
              soll. Nur Nutzer mit Marketing-Einwilligung erhalten die E-Mail.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Tarif
            </label>
            <div className="flex gap-2">
              {(
                [
                  ["all", "Alle"],
                  ["free", "Free"],
                  ["pro", "Pro"],
                  ["trial", "Trial"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    onChange({
                      ...campaign,
                      audience_filter: { ...filter, plan: value },
                    })
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    (filter.plan || "all") === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.has_newsletter === true}
                onChange={(e) =>
                  onChange({
                    ...campaign,
                    audience_filter: {
                      ...filter,
                      has_newsletter: e.target.checked || undefined,
                    },
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Nur Nutzer mit Marketing-Einwilligung
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Registriert nach
              </label>
              <input
                type="date"
                value={filter.registered_after || ""}
                onChange={(e) =>
                  onChange({
                    ...campaign,
                    audience_filter: {
                      ...filter,
                      registered_after: e.target.value || undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Registriert vor
              </label>
              <input
                type="date"
                value={filter.registered_before || ""}
                onChange={(e) =>
                  onChange({
                    ...campaign,
                    audience_filter: {
                      ...filter,
                      registered_before: e.target.value || undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button
              onClick={onCountRecipients}
              disabled={countLoading}
              variant="secondary"
            >
              {countLoading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Users className="w-4 h-4 mr-1.5" />
              )}
              Empfaenger zaehlen
            </Button>
            {recipientCount !== null && (
              <span className="text-sm font-medium text-dark">
                {recipientCount} Empfaenger gefunden
              </span>
            )}
          </div>

          <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Marketing-E-Mails sollten nur an Nutzer mit Marketing-Einwilligung
              gesendet werden. Stelle sicher, dass die Kampagne den
              DSGVO-Anforderungen entspricht.
            </p>
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {campaign.body_html ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Betreff: <strong>{campaign.subject}</strong>
                </p>
              </div>
              <div className="p-6">
                <div
                  className="max-w-[600px] mx-auto"
                  dangerouslySetInnerHTML={{ __html: campaign.body_html }}
                />
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <Eye className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p>Kein HTML-Inhalt vorhanden</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatAudienceShort(filter: AudienceFilter): string {
  const parts: string[] = [];
  if (filter.plan && filter.plan !== "all") {
    const labels: Record<string, string> = {
      free: "Free",
      pro: "Pro",
      trial: "Trial",
    };
    parts.push(labels[filter.plan] || filter.plan);
  } else {
    parts.push("Alle Nutzer");
  }
  if (filter.has_newsletter) parts.push("Newsletter");
  return parts.join(", ");
}
