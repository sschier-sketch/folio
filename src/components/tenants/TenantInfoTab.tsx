import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, FileText, Edit, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";

interface TenantInfoTabProps {
  tenantId: string;
  onUpdate: () => void;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export default function TenantInfoTab({
  tenantId,
  onUpdate,
}: TenantInfoTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (user && tenantId) {
      loadTenant();
    }
  }, [user, tenantId]);

  async function loadTenant() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

      if (data) {
        setTenant(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      console.error("Error loading tenant:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!tenant) return;

    try {
      const { error } = await supabase
        .from("tenants")
        .update(formData)
        .eq("id", tenant.id);

      if (!error) {
        setTenant({ ...tenant, ...formData });
        setIsEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating tenant:", error);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  if (!tenant) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-400">Mieter nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark">Stammdaten</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Bearbeiten
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: tenant.name || "",
                    email: tenant.email || "",
                    phone: tenant.phone || "",
                    address: tenant.address || "",
                    notes: tenant.notes || "",
                  });
                }}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">Name</div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              ) : (
                <div className="font-semibold text-dark">{tenant.name}</div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">E-Mail</div>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              ) : (
                <div className="text-gray-700">{tenant.email || "-"}</div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">Telefon</div>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              ) : (
                <div className="text-gray-700">{tenant.phone || "-"}</div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">Adresse</div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              ) : (
                <div className="text-gray-700">{tenant.address || "-"}</div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">Interne Notizen</div>
              {isEditing ? (
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Notizen zum Mieter..."
                />
              ) : (
                <div className="text-gray-700 whitespace-pre-wrap">
                  {tenant.notes || "-"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isPremium && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Weitere Dokumente
          </h3>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Keine Dokumente vorhanden</p>
            <p className="text-sm text-gray-400 mb-4">
              Laden Sie Selbstauskünfte oder andere Dokumente hoch
            </p>
            <button className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
              Dokument hochladen
            </button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Datenschutz:</p>
            <p>
              Alle Mieterdaten werden DSGVO-konform gespeichert und verarbeitet.
              Sie haben jederzeit die Möglichkeit, Daten zu exportieren oder zu
              löschen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
