import { useState, useEffect, useCallback } from "react";
import {
  Clock, FileText, User, Home, TrendingUp, FileCheck,
  CreditCard, Camera, Gauge, ClipboardList, DollarSign,
  Tag, Calendar, Receipt, ChevronDown, Filter,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumUpgradePrompt } from "../PremiumUpgradePrompt";

interface PropertyHistoryTabProps {
  propertyId: string;
}

interface HistoryEntry {
  id: string;
  event_type: string;
  event_description: string;
  changed_by_name: string | null;
  created_at: string;
  entity_type?: string;
  entity_id?: string;
  action?: string;
  source?: string;
  changes?: Record<string, any>;
  metadata?: {
    table_name?: string;
    operation?: string;
    changed_fields?: string[];
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
  };
}

const IGNORED_FIELDS = new Set([
  "id", "user_id", "property_id", "created_at", "updated_at",
  "deleted_at", "is_deleted",
]);

const PAGE_SIZE = 50;

export default function PropertyHistoryTab({ propertyId }: PropertyHistoryTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const loadHistory = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      let query = supabase
        .from("property_history")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const entries = data || [];
      setHasMore(entries.length === PAGE_SIZE);

      if (append) {
        setHistory((prev) => [...prev, ...entries]);
      } else {
        setHistory(entries);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [propertyId, entityFilter]);

  useEffect(() => {
    if (user) loadHistory();
  }, [user, loadHistory]);

  function getEventIcon(eventType: string) {
    if (eventType.startsWith("property_")) return <Home className="w-5 h-5 text-primary-blue" />;
    if (eventType.startsWith("unit_")) return <Home className="w-5 h-5 text-blue-600" />;
    if (eventType.startsWith("tenant_")) return <User className="w-5 h-5 text-emerald-600" />;
    if (eventType.startsWith("contract_")) return <FileText className="w-5 h-5 text-green-600" />;
    if (eventType.startsWith("equipment_")) return <FileCheck className="w-5 h-5 text-primary-blue" />;
    if (eventType.startsWith("contact_")) return <User className="w-5 h-5 text-blue-500" />;
    if (eventType.startsWith("maintenance_")) return <FileCheck className="w-5 h-5 text-amber-600" />;
    if (eventType.startsWith("document_")) return <FileText className="w-5 h-5 text-gray-600" />;
    if (eventType.startsWith("loan_")) return <CreditCard className="w-5 h-5 text-red-600" />;
    if (eventType.startsWith("payment_")) return <DollarSign className="w-5 h-5 text-green-600" />;
    if (eventType.startsWith("image_")) return <Camera className="w-5 h-5 text-blue-500" />;
    if (eventType.startsWith("meter_")) return <Gauge className="w-5 h-5 text-teal-600" />;
    if (eventType.startsWith("handover_")) return <ClipboardList className="w-5 h-5 text-orange-600" />;
    if (eventType.startsWith("income_")) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (eventType.startsWith("expense_")) return <Receipt className="w-5 h-5 text-red-500" />;
    if (eventType.startsWith("ticket_")) return <FileText className="w-5 h-5 text-amber-500" />;
    if (eventType.startsWith("valuation_")) return <TrendingUp className="w-5 h-5 text-blue-700" />;
    if (eventType.startsWith("label_")) return <Tag className="w-5 h-5 text-gray-500" />;
    if (eventType.startsWith("billing_")) return <Calendar className="w-5 h-5 text-blue-600" />;
    if (eventType.startsWith("operating_cost_")) return <Receipt className="w-5 h-5 text-orange-500" />;
    if (eventType.startsWith("deposit_")) return <DollarSign className="w-5 h-5 text-amber-600" />;
    if (eventType === "rent_increase") return <TrendingUp className="w-5 h-5 text-amber-600" />;
    if (eventType === "billing") return <FileText className="w-5 h-5 text-green-600" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  }

  const EVENT_LABELS: Record<string, string> = {
    property_created: "Immobilie angelegt",
    property_updated: "Immobilie aktualisiert",
    property_deleted: "Immobilie gelöscht",
    unit_created: "Einheit angelegt",
    unit_updated: "Einheit aktualisiert",
    unit_deleted: "Einheit gelöscht",
    tenant_created: "Mieter angelegt",
    tenant_updated: "Mieter aktualisiert",
    tenant_deleted: "Mieter gelöscht",
    contract_created: "Vertrag angelegt",
    contract_updated: "Vertrag aktualisiert",
    contract_deleted: "Vertrag gelöscht",
    contract_unit_created: "Vertragseinheit zugeordnet",
    contract_unit_deleted: "Vertragseinheit entfernt",
    contract_partner_created: "Vertragspartner hinzugefügt",
    contract_partner_updated: "Vertragspartner aktualisiert",
    contract_partner_deleted: "Vertragspartner entfernt",
    equipment_created: "Ausstattung angelegt",
    equipment_updated: "Ausstattung aktualisiert",
    equipment_deleted: "Ausstattung gelöscht",
    contact_created: "Kontakt angelegt",
    contact_updated: "Kontakt aktualisiert",
    contact_deleted: "Kontakt gelöscht",
    maintenance_created: "Wartung angelegt",
    maintenance_updated: "Wartung aktualisiert",
    maintenance_completed: "Wartung abgeschlossen",
    maintenance_deleted: "Wartung gelöscht",
    document_uploaded: "Dokument hochgeladen",
    document_updated: "Dokument aktualisiert",
    document_deleted: "Dokument gelöscht",
    loan_created: "Darlehen angelegt",
    loan_updated: "Darlehen aktualisiert",
    loan_deleted: "Darlehen gelöscht",
    payment_created: "Zahlung angelegt",
    payment_updated: "Zahlung aktualisiert",
    payment_deleted: "Zahlung gelöscht",
    image_created: "Foto hochgeladen",
    image_deleted: "Foto gelöscht",
    meter_created: "Zähler angelegt",
    meter_updated: "Zähler aktualisiert",
    meter_deleted: "Zähler gelöscht",
    meter_reading_created: "Zählerstand erfasst",
    meter_reading_updated: "Zählerstand aktualisiert",
    meter_reading_deleted: "Zählerstand gelöscht",
    handover_created: "Übergabeprotokoll erstellt",
    handover_updated: "Übergabeprotokoll aktualisiert",
    handover_deleted: "Übergabeprotokoll gelöscht",
    income_created: "Einnahme angelegt",
    income_updated: "Einnahme aktualisiert",
    income_deleted: "Einnahme gelöscht",
    expense_created: "Ausgabe angelegt",
    expense_updated: "Ausgabe aktualisiert",
    expense_deleted: "Ausgabe gelöscht",
    ticket_created: "Ticket erstellt",
    ticket_updated: "Ticket aktualisiert",
    ticket_deleted: "Ticket gelöscht",
    valuation_created: "Wertentwicklung erfasst",
    valuation_updated: "Wertentwicklung aktualisiert",
    valuation_deleted: "Wertentwicklung gelöscht",
    label_created: "Label hinzugefügt",
    label_deleted: "Label entfernt",
    billing_period_created: "Abrechnungszeitraum angelegt",
    billing_period_updated: "Abrechnungszeitraum aktualisiert",
    billing_period_deleted: "Abrechnungszeitraum gelöscht",
    operating_cost_created: "Betriebskostenabrechnung erstellt",
    operating_cost_updated: "Betriebskostenabrechnung aktualisiert",
    operating_cost_deleted: "Betriebskostenabrechnung gelöscht",
    deposit_created: "Kaution erfasst",
    deposit_updated: "Kaution aktualisiert",
    deposit_deleted: "Kaution gelöscht",
    tenant_change: "Mieterwechsel",
    rent_increase: "Mieterhöhung",
    billing: "Abrechnung",
    lease_assigned: "Mietvertrag zugeordnet",
    other: "Sonstiges",
  };

  const FIELD_LABELS: Record<string, string> = {
    name: "Name",
    address: "Adresse",
    street: "Straße",
    house_number: "Hausnummer",
    postal_code: "Postleitzahl",
    zip_code: "Postleitzahl",
    city: "Stadt",
    country: "Land",
    state: "Bundesland",
    property_type: "Immobilientyp",
    property_management_type: "Verwaltungsart",
    year_built: "Baujahr",
    total_area: "Gesamtfläche",
    size_sqm: "Größe (m²)",
    plot_size: "Grundstücksgröße",
    purchase_price: "Kaufpreis",
    purchase_date: "Kaufdatum",
    current_value: "Aktueller Wert",
    ownership_type: "Eigentumsart",
    notes: "Notizen",
    description: "Beschreibung",
    unit_number: "Einheitennummer",
    unit_type: "Einheitentyp",
    floor: "Etage",
    area_sqm: "Fläche (m²)",
    rooms: "Zimmeranzahl",
    status: "Status",
    rent_amount: "Miete",
    cold_rent: "Kaltmiete",
    warm_rent: "Warmmiete",
    additional_costs: "Nebenkosten",
    mea: "Miteigentumsanteil",
    location: "Lage",
    housegeld_monthly_cents: "Hausgeld",
    first_name: "Vorname",
    last_name: "Nachname",
    email: "E-Mail",
    phone: "Telefon",
    mobile: "Mobiltelefon",
    birth_date: "Geburtsdatum",
    nationality: "Nationalität",
    occupation: "Beruf",
    employer: "Arbeitgeber",
    monthly_income: "Monatliches Einkommen",
    previous_address: "Vorherige Adresse",
    contract_type: "Vertragsart",
    rent_type: "Mietart",
    start_date: "Startdatum",
    end_date: "Enddatum",
    rent: "Miete",
    deposit: "Kaution",
    deposit_amount: "Kautionsbetrag",
    deposit_type: "Kautionsart",
    deposit_status: "Kautionsstatus",
    notice_period: "Kündigungsfrist",
    payment_day: "Zahlungstag",
    rent_due_day: "Fälligkeitstag",
    company: "Firma",
    role: "Rolle",
    contact_name: "Kontaktname",
    contact_type: "Kontakttyp",
    title: "Titel",
    amount: "Betrag",
    interest_rate: "Zinssatz",
    monthly_rate: "Monatliche Rate",
    bank_name: "Bank",
    loan_number: "Darlehensnummer",
    remaining_balance: "Restschuld",
    heating_type: "Heizungsart",
    energy_source: "Energiequelle",
    construction_type: "Bauweise",
    roof_type: "Dachart",
    parking_spots: "Stellplätze",
    elevator: "Aufzug",
    balcony_terrace: "Balkon/Terrasse",
    garden: "Garten",
    cellar: "Keller",
    meter_number: "Zählernummer",
    meter_type: "Zählertyp",
    reading_interval: "Ableseintervall",
    value: "Wert",
    date: "Datum",
    transaction_type: "Transaktionsart",
    transaction_date: "Transaktionsdatum",
    payment_status: "Zahlungsstatus",
    due_date: "Fälligkeitsdatum",
    paid_date: "Bezahlt am",
    paid_amount: "Bezahlter Betrag",
    category: "Kategorie",
    priority: "Priorität",
    subject: "Betreff",
  };

  function formatValue(value: any): string {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    if (typeof value === "number") return value.toLocaleString("de-DE");
    if (typeof value === "string") {
      const translations: Record<string, string> = {
        vacant: "Leer", rented: "Vermietet", maintenance: "Wartung",
        self_occupied: "Selbstnutzung", owner_occupied: "Eigennutzung",
        apartment: "Wohnung", office: "Büro", parking: "Stellplatz/Garage",
        storage: "Lager", commercial: "Gewerbe",
        house: "Haus", condominium: "Eigentumswohnung", multi_family: "Mehrfamilienhaus",
        full_ownership: "Volleigentum", units_only: "Nur Einheiten",
        fixed_term: "Befristet", unlimited: "Unbefristet",
        active: "Aktiv", inactive: "Inaktiv", completed: "Abgeschlossen",
        pending: "Ausstehend", paid: "Bezahlt", overdue: "Überfällig",
        open: "Offen", closed: "Geschlossen", in_progress: "In Bearbeitung",
        cold: "Kalt", warm: "Warm",
        true: "Ja", false: "Nein",
      };
      const lower = value.toLowerCase();
      if (translations[lower]) return translations[lower];
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try { return new Date(value).toLocaleDateString("de-DE"); } catch { return value; }
      }
      return value;
    }
    return String(value);
  }

  function getChangedFields(entry: HistoryEntry) {
    if (entry.changes && entry.action === "update") {
      const fields: { field: string; oldVal: any; newVal: any }[] = [];
      for (const [key, diff] of Object.entries(entry.changes)) {
        if (IGNORED_FIELDS.has(key)) continue;
        if (key.startsWith("_")) continue;
        if (diff && typeof diff === "object" && "old" in diff && "new" in diff) {
          fields.push({ field: key, oldVal: diff.old, newVal: diff.new });
        }
      }
      return fields;
    }

    if (entry.metadata?.changed_fields && entry.metadata.changed_fields.length > 0) {
      const oldValues = entry.metadata.old_values || {};
      const newValues = entry.metadata.new_values || {};
      return entry.metadata.changed_fields
        .filter((f) => !IGNORED_FIELDS.has(f))
        .map((field) => {
          const fieldKey = Object.keys(newValues).find(
            (k) => k.toLowerCase().includes(field.toLowerCase()) ||
                  field.toLowerCase().includes(k.toLowerCase())
          );
          return {
            field,
            oldVal: fieldKey ? oldValues[fieldKey] : undefined,
            newVal: fieldKey ? newValues[fieldKey] : undefined,
          };
        })
        .filter((f) => f.oldVal !== undefined || f.newVal !== undefined);
    }

    return [];
  }

  function renderChangedFields(entry: HistoryEntry) {
    const fields = getChangedFields(entry);
    if (fields.length === 0) return null;

    return (
      <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Geänderte Felder:
        </p>
        <div className="space-y-1.5">
          {fields.map(({ field, oldVal, newVal }, idx) => (
            <div key={idx} className="text-xs bg-white rounded px-3 py-2 border border-gray-100">
              <div className="font-medium text-gray-700 mb-1">
                {FIELD_LABELS[field] || field}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-red-600 line-through">
                  {formatValue(oldVal)}
                </span>
                <span className="text-gray-400">&rarr;</span>
                <span className="text-green-600 font-medium">
                  {formatValue(newVal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ENTITY_FILTER_OPTIONS = [
    { value: "all", label: "Alle" },
    { value: "property", label: "Immobilie" },
    { value: "unit", label: "Einheiten" },
    { value: "tenant", label: "Mieter" },
    { value: "contract", label: "Verträge" },
    { value: "loan", label: "Darlehen" },
    { value: "payment", label: "Zahlungen" },
    { value: "document", label: "Dokumente" },
    { value: "meter", label: "Zähler" },
    { value: "equipment", label: "Ausstattung" },
    { value: "contact", label: "Kontakte" },
    { value: "maintenance", label: "Wartung" },
  ];

  if (!isPremium) {
    return <PremiumUpgradePrompt featureKey="property_history" />;
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-dark">Änderungshistorie</h3>
            <p className="text-sm text-gray-400 mt-1">
              Chronologische Auflistung aller Änderungen an dieser Immobilie und verbundenen Daten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
            >
              {ENTITY_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">Noch keine Einträge vorhanden</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100/80 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    {getEventIcon(entry.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-3 py-1 bg-white text-xs font-medium text-gray-700 rounded-full border border-gray-100">
                        {EVENT_LABELS[entry.event_type] || entry.event_type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.created_at).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} Uhr
                      </span>
                      {entry.changed_by_name && (
                        <span className="text-xs text-gray-500">
                          &bull; von {entry.changed_by_name}
                        </span>
                      )}
                      {entry.source === "trigger" && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-[10px] text-blue-600 rounded font-medium">
                          Auto
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{entry.event_description}</p>
                    {renderChangedFields(entry)}
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => loadHistory(history.length, true)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ChevronDown className="w-4 h-4" />
                  {loadingMore ? "Lädt..." : "Weitere laden"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Die Historie wird automatisch aktualisiert, wenn Änderungen an Einheiten,
          Mietverhältnissen, Darlehen, Zahlungen oder anderen Objektdaten vorgenommen werden.
          Alle Änderungen werden mit Datum, Uhrzeit und Benutzer protokolliert.
        </p>
      </div>
    </div>
  );
}
