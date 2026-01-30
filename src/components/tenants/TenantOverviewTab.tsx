import { useState, useEffect } from "react";
import {
  Home,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users,
  Edit,
  Save,
  X,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface TenantOverviewTabProps {
  tenantId: string;
}

interface Tenant {
  id: string;
  property_id: string | null;
  unit_id: string | null;
  salutation: string | null;
  first_name: string;
  last_name: string;
  name: string | null;
  street: string | null;
  house_number: string | null;
  zip_code: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  household_size: number | null;
  is_active: boolean | null;
  notes: string | null;
}

interface Property {
  id: string;
  name: string;
  address: string;
}

export default function TenantOverviewTab({
  tenantId,
}: TenantOverviewTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<{ id: string; unit_number: string }[]>([]);
  const [currentUnit, setCurrentUnit] = useState<{ id: string; unit_number: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Tenant | null>(null);

  useEffect(() => {
    if (user && tenantId) {
      loadData();
    }
  }, [user, tenantId]);

  useEffect(() => {
    if (formData?.property_id) {
      loadUnits(formData.property_id);
    } else {
      setUnits([]);
    }
  }, [formData?.property_id]);

  async function loadUnits(propertyId: string) {
    try {
      const { data } = await supabase
        .from("property_units")
        .select("id, unit_number")
        .eq("property_id", propertyId)
        .order("unit_number");

      if (data) {
        setUnits(data);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  async function loadData() {
    try {
      setLoading(true);

      const [tenantRes, propertiesRes] = await Promise.all([
        supabase.from("tenants").select("*").eq("id", tenantId).single(),
        supabase.from("properties").select("id, name, address").order("name"),
      ]);

      if (tenantRes.data) {
        setTenant(tenantRes.data);
        setFormData(tenantRes.data);

        if (tenantRes.data.property_id) {
          const { data: propertyData } = await supabase
            .from("properties")
            .select("id, name, address")
            .eq("id", tenantRes.data.property_id)
            .maybeSingle();

          if (propertyData) setProperty(propertyData);

          await loadUnits(tenantRes.data.property_id);

          if (tenantRes.data.unit_id) {
            const { data: unitData } = await supabase
              .from("property_units")
              .select("id, unit_number")
              .eq("id", tenantRes.data.unit_id)
              .maybeSingle();

            if (unitData) setCurrentUnit(unitData);
          }
        }
      }

      if (propertiesRes.data) setProperties(propertiesRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData || !tenant || !user) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      alert("Bitte geben Sie eine gültige E-Mail-Adresse ein");
      return;
    }

    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          property_id: formData.property_id,
          unit_id: formData.unit_id || null,
          salutation: formData.salutation,
          first_name: formData.first_name,
          last_name: formData.last_name,
          name: `${formData.first_name} ${formData.last_name}`,
          street: formData.street,
          house_number: formData.house_number,
          zip_code: formData.zip_code,
          city: formData.city,
          country: formData.country,
          email: formData.email,
          phone: formData.phone,
          move_in_date: formData.move_in_date,
          move_out_date: formData.move_out_date,
          household_size: formData.household_size,
          notes: formData.notes,
        })
        .eq("id", tenant.id);

      if (error) throw error;

      if (formData.property_id && formData.move_in_date) {
        const { data: existingContract } = await supabase
          .from("rental_contracts")
          .select("id")
          .eq("tenant_id", tenant.id)
          .maybeSingle();

        if (existingContract) {
          await supabase
            .from("rental_contracts")
            .update({
              property_id: formData.property_id,
              unit_id: formData.unit_id || null,
            })
            .eq("id", existingContract.id);
        } else {
          const { error: contractError } = await supabase
            .from("rental_contracts")
            .insert([
              {
                tenant_id: tenant.id,
                property_id: formData.property_id,
                unit_id: formData.unit_id || null,
                user_id: user.id,
                rent_type: "flat_rate",
                flat_rate_amount: 0,
                cold_rent: 0,
                total_advance: 0,
                operating_costs: 0,
                heating_costs: 0,
                rent_due_day: 1,
                base_rent: 0,
                monthly_rent: 0,
                additional_costs: 0,
                utilities_advance: 0,
                total_rent: 0,
                deposit_type: "none",
                deposit: 0,
                deposit_amount: 0,
                deposit_payment_type: "transfer",
                deposit_status: "complete",
                contract_start: formData.move_in_date,
                start_date: formData.move_in_date,
                contract_end: formData.move_out_date,
                end_date: formData.move_out_date,
                is_unlimited: !formData.move_out_date,
                contract_type: formData.move_out_date ? "limited" : "unlimited",
                status: "active",
              },
            ])
            .select()
            .single();

          if (contractError) {
            console.error("Error creating contract:", contractError);
          }
        }
      }

      setTenant(formData);
      setIsEditing(false);
      await loadData();
      alert("Änderungen erfolgreich gespeichert");
    } catch (error) {
      console.error("Error updating tenant:", error);
      alert("Fehler beim Speichern der Änderungen");
    }
  }

  async function handleDelete() {
    if (!tenant) return;

    if (
      !confirm(
        "Möchten Sie diesen Mieter wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      return;
    }

    try {
      const { error: deleteTenantError } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantId);

      if (deleteTenantError) throw deleteTenantError;

      alert("Mieter erfolgreich gelöscht");
      window.location.href = "/dashboard?view=tenants";
    } catch (error) {
      console.error("Error deleting tenant:", error);
      alert("Fehler beim Löschen des Mieters");
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  if (!tenant) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-dark mb-2">
          Mieter nicht gefunden
        </h3>
        <p className="text-gray-400">
          Der Mieter konnte nicht geladen werden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark">
            Mieterdaten
          </h3>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
                  className="px-4 py-2 rounded-full font-medium hover:bg-[#bdbfcb] transition-colors"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={handleDelete}
                  style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
                  className="px-4 py-2 rounded-full font-medium hover:bg-[#bdbfcb] transition-colors"
                >
                  Löschen
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(tenant);
                  }}
                  style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
                  className="px-4 py-2 rounded-full font-medium hover:bg-[#bdbfcb] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#008CFF] text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
                >
                  Speichern
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
                <Home className="w-5 h-5 text-[#1e1e24]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Immobilie</div>
                {isEditing && formData ? (
                  <div className="space-y-2">
                    <select
                      value={formData.property_id || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, property_id: e.target.value || null, unit_id: null })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    >
                      <option value="">Bitte wählen...</option>
                      {properties.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                          {prop.name}
                        </option>
                      ))}
                    </select>
                    {units.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Mieteinheit (Optional)</div>
                        <select
                          value={formData.unit_id || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, unit_id: e.target.value || null })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        >
                          <option value="">Keine Einheit zuweisen</option>
                          {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.unit_number}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-dark">
                      {property?.name || "Keine Immobilie zugeordnet"}
                    </div>
                    {currentUnit && (
                      <div className="text-sm text-gray-600">
                        Einheit: {currentUnit.unit_number}
                      </div>
                    )}
                    {property?.address && (
                      <div className="text-sm text-gray-600">{property.address}</div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
                <User className="w-5 h-5 text-[#1e1e24]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Name</div>
                {isEditing && formData ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      placeholder="Vorname"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      placeholder="Nachname"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                ) : (
                  <div className="font-semibold text-dark">
                    {tenant.salutation ? `${tenant.salutation} ` : ""}
                    {tenant.first_name} {tenant.last_name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
                <Mail className="w-5 h-5 text-[#1e1e24]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">E-Mail</div>
                {isEditing && formData ? (
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                ) : (
                  <div className="text-gray-700 font-semibold">{tenant.email || "-"}</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
                <Phone className="w-5 h-5 text-[#1e1e24]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Telefon</div>
                {isEditing && formData ? (
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                ) : (
                  <div className="text-gray-700 font-semibold">{tenant.phone || "-"}</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
                <MapPin className="w-5 h-5 text-[#1e1e24]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Adresse</div>
                {isEditing && formData ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={formData.street || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, street: e.target.value })
                        }
                        placeholder="Straße"
                        className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                      <input
                        type="text"
                        value={formData.house_number || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, house_number: e.target.value })
                        }
                        placeholder="Nr."
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={formData.zip_code || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, zip_code: e.target.value })
                        }
                        placeholder="PLZ"
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                      <input
                        type="text"
                        value={formData.city || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="Stadt"
                        className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {tenant.street || tenant.house_number ? (
                      <div className="font-semibold text-dark">
                        {tenant.street} {tenant.house_number}
                      </div>
                    ) : (
                      <div className="text-gray-700">-</div>
                    )}
                    {tenant.zip_code || tenant.city ? (
                      <div className="text-sm text-gray-600">
                        {tenant.zip_code} {tenant.city}
                      </div>
                    ) : null}
                    {tenant.country && tenant.country !== "Deutschland" && (
                      <div className="text-sm text-gray-600">{tenant.country}</div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
                <Calendar className="w-5 h-5 text-[#1e1e24]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Einzug / Auszug</div>
                {isEditing && formData ? (
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={formData.move_in_date || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, move_in_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                    <input
                      type="date"
                      value={formData.move_out_date || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, move_out_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-dark">
                      Einzug:{" "}
                      {tenant.move_in_date
                        ? new Date(tenant.move_in_date).toLocaleDateString("de-DE")
                        : "-"}
                    </div>
                    {tenant.move_out_date && (
                      <div className="text-sm text-gray-600">
                        Auszug:{" "}
                        {new Date(tenant.move_out_date).toLocaleDateString("de-DE")}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center shrink-0 border border-[#DDE7FF]">
                <Users className="w-5 h-5 text-[#1e1e24]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Haushaltsgröße</div>
                {isEditing && formData ? (
                  <input
                    type="number"
                    min="1"
                    value={formData.household_size || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        household_size: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                ) : (
                  <div className="font-semibold text-dark">
                    {tenant.household_size || 1}{" "}
                    {tenant.household_size === 1 ? "Person" : "Personen"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isEditing && formData && (
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm text-gray-400 mb-2">Interne Notizen</div>
            <textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="Notizen zum Mieter..."
            />
          </div>
        )}

        {!isEditing && tenant.notes && (
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm text-gray-400 mb-2">Interne Notizen</div>
            <div className="text-gray-700 whitespace-pre-wrap">{tenant.notes}</div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Hinweis:</p>
          <p>
            Alle Mieterdaten werden DSGVO-konform gespeichert. Sie können die
            Daten jederzeit bearbeiten oder den Mieter löschen.
          </p>
        </div>
      </div>
    </div>
  );
}
