import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Eye,
  User,
  Users,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ShieldCheck,
  UserCheck,
  Ban,
  Calendar,
  Monitor,
  Loader2,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Send,
  AlertCircle,
  MessageSquare,
  Landmark,
  AlertTriangle,
  Trash2,
  Download,
  Home,
  Key,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import UserActionsDropdown from "./UserActionsDropdown";
import AdminNewMessageModal from "./AdminNewMessageModal";

interface LoginEntry {
  id: string;
  ip_address: string | null;
  city: string | null;
  country: string | null;
  user_agent: string | null;
  logged_in_at: string;
}

interface EmailLogEntry {
  id: string;
  mail_type: string;
  subject: string;
  status: string;
  to_email: string;
  category: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  address_street: string | null;
  address_house_number: string | null;
  address_zip: string | null;
  address_city: string | null;
  address_country: string | null;
  phone: string | null;
  registration_ip: string | null;
  registration_city: string | null;
  registration_country: string | null;
  newsletter_opt_in: boolean;
  customer_number: string | null;
  banned: boolean;
  ban_reason: string | null;
}

interface AccountMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_read_only: boolean;
  is_active_member: boolean;
  property_scope: string;
  property_access: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface ContactTicketEntry {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  created_at: string;
  answered_at: string | null;
  closed_at: string | null;
}

interface BankConnection {
  id: string;
  bank_name: string;
  status: string;
  last_sync_at: string | null;
  error_message: string | null;
  last_issue_message: string | null;
  created_at: string;
}

interface PropertyWithUnits {
  id: string;
  name: string;
  address_street: string | null;
  address_city: string | null;
  units_count: number;
}

interface UserStats {
  subUsers: number;
  properties: PropertyWithUnits[];
  totalUnits: number;
  totalTenants: number;
}

interface AdminUserDetailViewProps {
  userId: string;
  userEmail: string;
  userCreatedAt: string;
  lastSignInAt?: string;
  subscriptionPlan?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  isCancelling?: boolean;
  onBack: () => void;
  onImpersonate: (userId: string, email: string) => void;
  onCancelSubscription: (userId: string) => void;
  onRefund: (userId: string, email: string) => void;
  onGrantAdmin: (userId: string, email: string) => void;
  onRevokeAdmin: (userId: string, email: string) => void;
  onBan: (userId: string, email: string) => void;
  onUnban: (userId: string, email: string) => void;
  onDelete: (userId: string, email: string) => void;
  onEditEmail: (userId: string, email: string) => void;
  onExtendTrial?: (userId: string, email: string) => void;
}

type HistoryTab = "logins" | "emails" | "tickets";

const EMAIL_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  sent: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Gesendet" },
  queued: { bg: "bg-amber-50", text: "text-amber-700", label: "Warteschlange" },
  failed: { bg: "bg-red-50", text: "text-red-700", label: "Fehlgeschlagen" },
  processing: { bg: "bg-blue-50", text: "text-blue-700", label: "In Bearbeitung" },
};

export default function AdminUserDetailView({
  userId,
  userEmail,
  userCreatedAt,
  lastSignInAt,
  subscriptionPlan,
  isAdmin,
  isBanned,
  isCancelling,
  onBack,
  onImpersonate,
  onCancelSubscription,
  onRefund,
  onGrantAdmin,
  onRevokeAdmin,
  onBan,
  onUnban,
  onDelete,
  onEditEmail,
  onExtendTrial,
}: AdminUserDetailViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailLogEntry[]>([]);
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [contactTickets, setContactTickets] = useState<ContactTicketEntry[]>([]);
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ subUsers: 0, properties: [], totalUnits: 0, totalTenants: 0 });
  const [bankActionBusy, setBankActionBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [emailPage, setEmailPage] = useState(0);
  const [activeHistoryTab, setActiveHistoryTab] = useState<HistoryTab>("logins");
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);
    try {
      const [profileRes, historyRes, membersRes, emailRes, ticketsRes, bankRes] = await Promise.all([
        supabase
          .from("account_profiles")
          .select(
            "user_id, first_name, last_name, company_name, address_street, address_house_number, address_zip, address_city, address_country, phone, registration_ip, registration_city, registration_country, newsletter_opt_in, customer_number, banned, ban_reason"
          )
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("login_history")
          .select("*")
          .eq("user_id", userId)
          .order("logged_in_at", { ascending: false })
          .range(0, PAGE_SIZE - 1),
        supabase.rpc("admin_get_account_members", { p_owner_id: userId }),
        supabase
          .from("email_logs")
          .select("id, mail_type, subject, status, to_email, category, created_at, sent_at, error_message")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(0, PAGE_SIZE - 1),
        supabase
          .from("tickets")
          .select("id, ticket_number, subject, status, created_at, answered_at, closed_at")
          .eq("ticket_type", "contact")
          .ilike("contact_email", userEmail)
          .order("created_at", { ascending: false }),
        supabase
          .from("banksapi_connections")
          .select("id, bank_name, status, last_sync_at, error_message, last_issue_message, created_at")
          .eq("user_id", userId)
          .neq("status", "disconnected")
          .order("created_at", { ascending: false }),
      ]);

      setProfile(profileRes.data);
      setLoginHistory(historyRes.data || []);
      setMembers((membersRes.data as AccountMember[]) || []);
      setEmailHistory(emailRes.data || []);
      setContactTickets(ticketsRes.data || []);
      setBankConnections(bankRes.data || []);

      const [subUsersRes, propertiesRes, tenantsRes] = await Promise.all([
        supabase
          .from("user_settings")
          .select("id", { count: "exact", head: true })
          .eq("account_owner_id", userId)
          .neq("user_id", userId),
        supabase
          .from("properties")
          .select("id, name, address_street, address_city, property_units(id)")
          .eq("user_id", userId),
        supabase
          .from("rental_contracts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .is("deleted_at", null),
      ]);

      const props: PropertyWithUnits[] = (propertiesRes.data || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        address_street: p.address_street as string | null,
        address_city: p.address_city as string | null,
        units_count: Array.isArray(p.property_units) ? p.property_units.length : 0,
      }));

      setUserStats({
        subUsers: subUsersRes.count ?? 0,
        properties: props,
        totalUnits: props.reduce((s, p) => s + p.units_count, 0),
        totalTenants: tenantsRes.count ?? 0,
      });
    } catch (err) {
      console.error("Error loading user detail:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreHistory() {
    const nextPage = historyPage + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("login_history")
      .select("*")
      .eq("user_id", userId)
      .order("logged_in_at", { ascending: false })
      .range(from, to);
    if (data && data.length > 0) {
      setLoginHistory((prev) => [...prev, ...data]);
      setHistoryPage(nextPage);
    }
  }

  async function loadMoreEmails() {
    const nextPage = emailPage + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("email_logs")
      .select("id, mail_type, subject, status, to_email, category, created_at, sent_at, error_message")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data && data.length > 0) {
      setEmailHistory((prev) => [...prev, ...data]);
      setEmailPage(nextPage);
    }
  }

  async function handleBankAction(action: "sync" | "delete", connectionId: string, bankName: string) {
    if (action === "delete" && !confirm(`Bankverbindung "${bankName}" wirklich loeschen?`)) return;
    setBankActionBusy(`${action}-${connectionId}`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-banksapi-action`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, connectionId }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Aktion fehlgeschlagen");
      } else {
        loadData();
      }
    } catch {
      alert("Netzwerkfehler");
    } finally {
      setBankActionBusy(null);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateTime(d: string) {
    return new Date(d).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function parseBrowser(ua: string | null): string {
    if (!ua) return "-";
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Edg")) return "Edge";
    return "Sonstige";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const prefillName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ") || "";

  const displayName = prefillName || userEmail;

  const address = [
    [profile?.address_street, profile?.address_house_number]
      .filter(Boolean)
      .join(" "),
    [profile?.address_zip, profile?.address_city].filter(Boolean).join(" "),
    profile?.address_country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
    {showNewMessage && (
      <AdminNewMessageModal
        onClose={() => setShowNewMessage(false)}
        onCreated={() => {
          setShowNewMessage(false);
          loadData();
        }}
        prefillEmail={userEmail}
        prefillName={prefillName}
      />
    )}
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zur Benutzerliste
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
            <User className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-500">{userEmail}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {profile?.banned ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                  <Ban className="w-3 h-3" /> Gesperrt
                </span>
              ) : isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldCheck className="w-3 h-3" /> Administrator
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <UserCheck className="w-3 h-3" /> Eigentümer
                </span>
              )}
              {subscriptionPlan === "pro" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Pro
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                  Gratis
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowNewMessage(true)}
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Nachricht schreiben
          </Button>
          <Button
            variant="secondary"
            onClick={() => onImpersonate(userId, userEmail)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Als Nutzer anmelden
          </Button>
          <UserActionsDropdown
            userId={userId}
            userEmail={userEmail}
            isPro={subscriptionPlan === "pro"}
            isCancelling={!!isCancelling}
            isAdmin={!!isAdmin}
            isBanned={!!isBanned}
            onImpersonate={onImpersonate}
            onCancelSubscription={onCancelSubscription}
            onRefund={onRefund}
            onGrantAdmin={onGrantAdmin}
            onRevokeAdmin={onRevokeAdmin}
            onBan={onBan}
            onUnban={onUnban}
            onDelete={onDelete}
            onEditEmail={onEditEmail}
            onExtendTrial={onExtendTrial}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{userStats.subUsers}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Team-Mitglieder</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center">
              <Home className="w-3.5 h-3.5 text-teal-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{userStats.properties.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Immobilien</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{userStats.totalUnits}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Einheiten gesamt</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{userStats.totalTenants}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Mietverhaeltnisse</p>
        </div>
      </div>

      {userStats.properties.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Home className="w-4 h-4 text-gray-400" />
              Immobilien
            </h2>
            <span className="text-xs text-gray-400">
              {userStats.properties.length} Objekte, {userStats.totalUnits} Einheiten
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {userStats.properties.map((prop) => (
              <div key={prop.id} className="px-6 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{prop.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {[prop.address_street, prop.address_city].filter(Boolean).join(", ") || "Keine Adresse"}
                  </p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0 ml-3">
                  {prop.units_count} {prop.units_count === 1 ? "Einheit" : "Einheiten"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Stammdaten">
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="Kundennummer"
            value={profile?.customer_number || "-"}
          />
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="Vorname"
            value={profile?.first_name || "-"}
          />
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="Nachname"
            value={profile?.last_name || "-"}
          />
          <InfoRow
            icon={<Building2 className="w-4 h-4" />}
            label="Firma"
            value={profile?.company_name || "-"}
          />
          <InfoRow
            icon={<Mail className="w-4 h-4" />}
            label="E-Mail"
            value={userEmail}
          />
          <InfoRow
            icon={<Phone className="w-4 h-4" />}
            label="Telefon"
            value={profile?.phone || "-"}
          />
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Adresse"
            value={address || "-"}
          />
        </Section>

        <Section title="Account-Informationen">
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Registriert am"
            value={formatDateTime(userCreatedAt) + " Uhr"}
          />
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label="Letzter Login"
            value={lastSignInAt ? formatDateTime(lastSignInAt) + " Uhr" : "-"}
          />
          <InfoRow
            icon={<Globe className="w-4 h-4" />}
            label="Registrierungs-IP"
            value={profile?.registration_ip || "-"}
          />
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Registrierungsort"
            value={
              [profile?.registration_city, profile?.registration_country]
                .filter(Boolean)
                .join(", ") || "-"
            }
          />
          <InfoRow
            icon={
              profile?.newsletter_opt_in ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )
            }
            label="Marketing-Zustimmung"
            value={profile?.newsletter_opt_in ? "Ja" : "Nein"}
          />
        </Section>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-gray-400" />
            Bankanbindung
          </h2>
          {bankConnections.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3 h-3" />
              {bankConnections.length} {bankConnections.length === 1 ? "Verbindung" : "Verbindungen"}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
              Keine Verbindung
            </span>
          )}
        </div>
        {bankConnections.length === 0 ? (
          <div className="px-6 py-6 text-center text-sm text-gray-400">
            Keine aktive Bankanbindung vorhanden
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bankConnections.map((conn) => {
              const statusMap: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
                connected: { color: "text-emerald-600", label: "Verbunden", icon: <CheckCircle className="w-3.5 h-3.5" /> },
                requires_sca: { color: "text-amber-600", label: "Freigabe noetig", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                syncing: { color: "text-blue-600", label: "Synchronisiert", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
                error: { color: "text-red-600", label: "Fehler", icon: <AlertCircle className="w-3.5 h-3.5" /> },
              };
              const s = statusMap[conn.status] || statusMap.error;
              return (
                <div key={conn.id} className="px-6 py-3 flex items-center gap-4">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{conn.bank_name || "Unbekannte Bank"}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.color}`}>
                        {s.icon}
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span>Verbunden seit {formatDate(conn.created_at)}</span>
                      {conn.last_sync_at && (
                        <span>Letzter Sync: {formatDateTime(conn.last_sync_at)}</span>
                      )}
                    </div>
                    {(conn.error_message || conn.last_issue_message) && (
                      <p className="text-xs text-red-500 mt-0.5 truncate">
                        {conn.error_message || conn.last_issue_message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {conn.status === "connected" && (
                      <button
                        onClick={() => handleBankAction("sync", conn.id, conn.bank_name)}
                        disabled={!!bankActionBusy}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors disabled:opacity-40"
                        title="Kontoumsaetze abrufen"
                      >
                        {bankActionBusy === `sync-${conn.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Sync
                      </button>
                    )}
                    <button
                      onClick={() => handleBankAction("delete", conn.id, conn.bank_name)}
                      disabled={!!bankActionBusy}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-40"
                      title="Verbindung loeschen"
                    >
                      {bankActionBusy === `delete-${conn.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Loeschen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {members.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Benutzer im Account
            </h2>
            <span className="text-xs text-gray-400">
              {members.length} {members.length === 1 ? "Benutzer" : "Benutzer"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-500">E-Mail</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Rolle</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Zugriff</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Objekte</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Beigetreten</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Letzter Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-700">{m.email}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {[m.first_name, m.last_name].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {m.role === "member" ? "Mitglied" : m.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {m.is_read_only ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Lock className="w-3 h-3" /> Nur Lesen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Unlock className="w-3 h-3" /> Schreiben
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {m.property_scope === "all" ? "Alle" : "Ausgewählte"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                      {m.last_sign_in_at ? formatDate(m.last_sign_in_at) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
            <button
              onClick={() => setActiveHistoryTab("logins")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeHistoryTab === "logins"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Login-Verlauf
              <span className="text-xs text-gray-400 ml-1">
                {loginHistory.length}
              </span>
            </button>
            <button
              onClick={() => setActiveHistoryTab("emails")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeHistoryTab === "emails"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              E-Mail-Verlauf
              <span className="text-xs text-gray-400 ml-1">
                {emailHistory.length}
              </span>
            </button>
            <button
              onClick={() => setActiveHistoryTab("tickets")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeHistoryTab === "tickets"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Tickets
              {contactTickets.length > 0 && (
                <span className="text-xs text-gray-400 ml-1">
                  {contactTickets.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeHistoryTab === "logins" && (
          <>
            {loginHistory.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                Noch keine Logins erfasst
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Datum & Uhrzeit
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        IP-Adresse
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Ort
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Land
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Browser
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loginHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                          {formatDateTime(entry.logged_in_at)} Uhr
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">
                          {entry.ip_address || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {entry.city || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {entry.country || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {parseBrowser(entry.user_agent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {loginHistory.length > 0 && loginHistory.length % PAGE_SIZE === 0 && (
              <div className="px-6 py-3 border-t border-gray-100 text-center">
                <button
                  onClick={loadMoreHistory}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mehr laden
                </button>
              </div>
            )}
          </>
        )}

        {activeHistoryTab === "emails" && (
          <>
            {emailHistory.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                Noch keine E-Mails an diesen Nutzer gesendet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Datum
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Betreff
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Typ
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Kategorie
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {emailHistory.map((entry) => {
                      const statusStyle = EMAIL_STATUS_STYLES[entry.status] || {
                        bg: "bg-gray-50",
                        text: "text-gray-600",
                        label: entry.status,
                      };
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50/50 group">
                          <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                            {formatDateTime(entry.sent_at || entry.created_at)} Uhr
                          </td>
                          <td className="px-4 py-2.5 text-gray-800 max-w-xs">
                            <div className="truncate">{entry.subject}</div>
                            {entry.error_message && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-red-500">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{entry.error_message}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs font-mono text-gray-500">
                              {entry.mail_type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">
                            {entry.category === "transactional" ? "Transaktional" : "Informativ"}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                            >
                              {statusStyle.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {emailHistory.length > 0 && emailHistory.length % PAGE_SIZE === 0 && (
              <div className="px-6 py-3 border-t border-gray-100 text-center">
                <button
                  onClick={loadMoreEmails}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mehr laden
                </button>
              </div>
            )}
          </>
        )}

        {activeHistoryTab === "tickets" && (
          <>
            {contactTickets.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                Keine Kontakt-Tickets fuer diesen Nutzer
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Ticket-Nr.
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Betreff
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Erstellt
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                        Beantwortet
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contactTickets.map((ticket) => {
                      const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
                        open: { bg: "bg-blue-50", text: "text-blue-700", label: "Offen" },
                        answered: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Beantwortet" },
                        closed: { bg: "bg-gray-100", text: "text-gray-600", label: "Geschlossen" },
                      };
                      const s = statusStyles[ticket.status] || statusStyles.open;
                      return (
                        <tr key={ticket.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">
                            #{ticket.ticket_number}
                          </td>
                          <td className="px-4 py-2.5 text-gray-800 max-w-xs">
                            <div className="truncate">{ticket.subject}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                            {formatDateTime(ticket.created_at)} Uhr
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                            {ticket.answered_at ? formatDateTime(ticket.answered_at) + " Uhr" : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-3">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="text-xs font-medium text-gray-400 w-36 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}
