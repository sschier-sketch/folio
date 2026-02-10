import { useState, useEffect } from "react";
import { Edit, Trash2, Home, X, FileText } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { parseNumberInput } from "../../lib/utils";
import TenantModal from "../TenantModal";
import TableActionsDropdown, { ActionItem } from "../common/TableActionsDropdown";
import { Button } from '../ui/Button';

interface PropertyUnitsTabProps {
  propertyId: string;
}

interface PropertyUnit {
  id: string;
  unit_number: string;
  unit_type: string;
  floor: number | null;
  area_sqm: number | null;
  rooms: number | null;
  status: string;
  rent_amount: number | null;
  notes: string;
  mea?: string | null;
  location?: string | null;
  description?: string | null;
  housegeld_monthly_cents?: number | null;
  purchase_price?: number | null;
  current_value?: number | null;
  purchase_date?: string | null;
  broker_costs?: number | null;
  notary_costs?: number | null;
  lawyer_costs?: number | null;
  real_estate_transfer_tax?: number | null;
  registration_costs?: number | null;
  expert_costs?: number | null;
  tenant?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  rental_contract?: {
    id: string;
    base_rent: number;
  } | null;
  outstanding_rent?: number;
}

export default function PropertyUnitsTab({ propertyId }: PropertyUnitsTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<PropertyUnit | null>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedUnitForTenant, setSelectedUnitForTenant] = useState<PropertyUnit | null>(null);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [ownershipType, setOwnershipType] = useState<string>("full_property");
  const [formData, setFormData] = useState({
    unit_number: "",
    unit_type: "apartment",
    location: "",
    area_sqm: "",
    rooms: "",
    status: "vacant",
    mea: "",
    description: "",
    hausgeld: "",
    notes: "",
    purchase_price: "",
    current_value: "",
    purchase_date: "",
    broker_costs: "",
    notary_costs: "",
    lawyer_costs: "",
    real_estate_transfer_tax: "",
    registration_costs: "",
    expert_costs: "",
  });

  useEffect(() => {
    if (user) {
      loadUnits();
      loadProperty();
    }
  }, [user, propertyId]);

  async function loadProperty() {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, ownership_type")
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      if (data) {
        setProperties([data]);
        setOwnershipType(data.ownership_type || "full_property");
      }
    } catch (error) {
      console.error("Error loading property:", error);
    }
  }

  async function loadUnits() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("property_units")
        .select("*")
        .eq("property_id", propertyId)
        .order("unit_number", { ascending: true });

      if (error) throw error;

      const unitsWithDetails = await Promise.all(
        (data || []).map(async (unit) => {
          let tenant = null;
          let rentalContract = null;
          let outstandingRent = 0;
          let unitStatus = unit.status;

          const { data: tenantData } = await supabase
            .from("tenants")
            .select("id, first_name, last_name")
            .eq("unit_id", unit.id)
            .eq("is_active", true)
            .maybeSingle();

          if (tenantData) {
            tenant = tenantData;
            unitStatus = "rented";

            const { data: contractData } = await supabase
              .from("rental_contracts")
              .select("id, base_rent")
              .eq("tenant_id", tenantData.id)
              .eq("property_id", propertyId)
              .maybeSingle();

            rentalContract = contractData;

            if (rentalContract) {
              const today = new Date().toISOString().split('T')[0];
              const { data: payments } = await supabase
                .from("rent_payments")
                .select("amount, paid_amount, payment_status")
                .eq("contract_id", rentalContract.id)
                .in("payment_status", ["unpaid", "partial"])
                .lt("due_date", today);

              if (payments && payments.length > 0) {
                outstandingRent = payments.reduce((sum, p) => sum + (Number(p.amount) - Number(p.paid_amount || 0)), 0);
              }
            }
          }

          return {
            ...unit,
            tenant,
            rental_contract: rentalContract,
            outstanding_rent: outstandingRent,
            status: unitStatus
          };
        })
      );

      setUnits(unitsWithDetails);
    } catch (error) {
      console.error("Error loading units:", error);
    } finally {
      setLoading(false);
    }
  }


  async function handleSaveUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const unitData: any = {
        property_id: propertyId,
        user_id: user.id,
        unit_number: formData.unit_number,
        unit_type: formData.unit_type,
        floor: null,
        area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
        rooms: formData.rooms ? parseInt(formData.rooms) : null,
        status: formData.status,
        notes: formData.notes,
        mea: formData.mea || null,
        location: formData.location || null,
        description: formData.description || null,
        housegeld_monthly_cents: formData.hausgeld ? Math.round(parseNumberInput(formData.hausgeld) * 100) : 0,
      };

      if (ownershipType === "units_only") {
        unitData.purchase_price = formData.purchase_price ? parseNumberInput(formData.purchase_price) : 0;
        unitData.current_value = formData.current_value ? parseNumberInput(formData.current_value) : 0;
        unitData.purchase_date = formData.purchase_date && formData.purchase_date.trim() !== "" ? formData.purchase_date : null;
        unitData.broker_costs = formData.broker_costs ? parseNumberInput(formData.broker_costs) : 0;
        unitData.notary_costs = formData.notary_costs ? parseNumberInput(formData.notary_costs) : 0;
        unitData.lawyer_costs = formData.lawyer_costs ? parseNumberInput(formData.lawyer_costs) : 0;
        unitData.real_estate_transfer_tax = formData.real_estate_transfer_tax ? parseNumberInput(formData.real_estate_transfer_tax) : 0;
        unitData.registration_costs = formData.registration_costs ? parseNumberInput(formData.registration_costs) : 0;
        unitData.expert_costs = formData.expert_costs ? parseNumberInput(formData.expert_costs) : 0;
      }

      if (editingUnit) {
        const { error } = await supabase
          .from("property_units")
          .update(unitData)
          .eq("id", editingUnit.id);

        if (error) throw error;

        await supabase.from("property_history").insert([
          {
            property_id: propertyId,
            user_id: user.id,
            event_type: "unit_updated",
            event_description: `Einheiten: Einheit ${formData.unit_number} wurde aktualisiert`,
          },
        ]);
      } else {
        const { error } = await supabase.from("property_units").insert([unitData]);

        if (error) throw error;

        await supabase.from("property_history").insert([
          {
            property_id: propertyId,
            user_id: user.id,
            event_type: "unit_created",
            event_description: `Einheiten: Einheit ${formData.unit_number} wurde angelegt`,
          },
        ]);
      }

      setShowModal(false);
      setEditingUnit(null);
      resetForm();
      loadUnits();
    } catch (error) {
      console.error("Error saving unit:", error);
      alert("Fehler beim Speichern der Einheit");
    }
  }

  async function handleDeleteUnit(unit: PropertyUnit) {
    if (!confirm(`Möchten Sie die Einheit ${unit.unit_number} wirklich löschen?`))
      return;

    try {
      const { error } = await supabase.from("property_units").delete().eq("id", unit.id);

      if (error) throw error;

      if (user) {
        await supabase.from("property_history").insert([
          {
            property_id: propertyId,
            user_id: user.id,
            event_type: "unit_deleted",
            event_description: `Einheiten: Einheit ${unit.unit_number} wurde gelöscht`,
          },
        ]);
      }

      loadUnits();
    } catch (error) {
      console.error("Error deleting unit:", error);
    }
  }

  function openEditModal(unit: PropertyUnit) {
    setEditingUnit(unit);
    setFormData({
      unit_number: unit.unit_number,
      unit_type: unit.unit_type,
      location: unit.location || (unit.floor ? `${unit.floor}. OG` : ""),
      area_sqm: unit.area_sqm ? unit.area_sqm.toString() : "",
      rooms: unit.rooms ? unit.rooms.toString() : "",
      status: unit.status,
      mea: unit.mea || "",
      description: unit.description || "",
      hausgeld: unit.housegeld_monthly_cents ? (unit.housegeld_monthly_cents / 100).toFixed(2) : "",
      notes: unit.notes || "",
      purchase_price: unit.purchase_price ? String(unit.purchase_price) : "",
      current_value: unit.current_value ? String(unit.current_value) : "",
      purchase_date: unit.purchase_date || "",
      broker_costs: unit.broker_costs ? String(unit.broker_costs) : "",
      notary_costs: unit.notary_costs ? String(unit.notary_costs) : "",
      lawyer_costs: unit.lawyer_costs ? String(unit.lawyer_costs) : "",
      real_estate_transfer_tax: unit.real_estate_transfer_tax ? String(unit.real_estate_transfer_tax) : "",
      registration_costs: unit.registration_costs ? String(unit.registration_costs) : "",
      expert_costs: unit.expert_costs ? String(unit.expert_costs) : "",
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      unit_number: "",
      unit_type: "apartment",
      location: "",
      area_sqm: "",
      rooms: "",
      status: "vacant",
      mea: "",
      description: "",
      hausgeld: "",
      notes: "",
      purchase_price: "",
      current_value: "",
      purchase_date: "",
      broker_costs: "",
      notary_costs: "",
      lawyer_costs: "",
      real_estate_transfer_tax: "",
      registration_costs: "",
      expert_costs: "",
    });
  }

  const getUnitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: "Wohnung",
      office: "Büro",
      parking: "Stellplatz",
      storage: "Lager",
      commercial: "Gewerbe",
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      vacant: "Leer",
      rented: "Vermietet",
      maintenance: "Wartung",
      self_occupied: "Selbstnutzung",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      vacant: "bg-amber-100 text-amber-700",
      rented: "bg-emerald-100 text-emerald-700",
      maintenance: "bg-blue-100 text-blue-700",
      self_occupied: "bg-purple-100 text-purple-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getLocationDisplay = (unit: PropertyUnit) => {
    if (unit.location) return unit.location;
    if (unit.floor !== null) return `${unit.floor}. OG`;
    return null;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dark">Einheiten</h3>
            <p className="text-sm text-gray-400 mt-1">
              Verwalten Sie die Einheiten dieser Immobilie
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingUnit(null);
              resetForm();
              setShowModal(true);
            }}
            variant="primary"
          >
            Einheit hinzufügen
          </Button>
        </div>

        {units.length === 0 ? (
          <div className="p-12 text-center">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Noch keine Einheiten angelegt</p>
            <Button
              onClick={() => {
                setEditingUnit(null);
                resetForm();
                setShowModal(true);
              }}
              variant="primary"
            >
              Erste Einheit hinzufügen
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Bezeichnung
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Typ
                  </th>
                  {isPremium && (
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                      Etage / Lage
                    </th>
                  )}
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Fläche
                  </th>
                  {isPremium && (
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                      Zimmer
                    </th>
                  )}
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Miete
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Überfällige Miete
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} className="border-b border-gray-100">
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-dark">{unit.unit_number}</div>
                      {unit.tenant && (
                        <div className="text-xs text-gray-500 mt-1">
                          {unit.tenant.first_name} {unit.tenant.last_name}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {getUnitTypeLabel(unit.unit_type)}
                    </td>
                    {isPremium && (
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {getLocationDisplay(unit) || <span className="text-gray-400">-</span>}
                      </td>
                    )}
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {unit.area_sqm ? `${unit.area_sqm} m²` : <span className="text-gray-400">-</span>}
                    </td>
                    {isPremium && (
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {unit.rooms || <span className="text-gray-400">-</span>}
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}
                      >
                        {getStatusLabel(unit.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-dark">
                      {unit.rental_contract?.base_rent
                        ? `${unit.rental_contract.base_rent.toFixed(2)} €`
                        : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {unit.outstanding_rent && unit.outstanding_rent > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {unit.outstanding_rent.toFixed(2)} € offen
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center">
                        <TableActionsDropdown
                          actions={[
                            ...(unit.status !== "rented" ? [{
                              label: 'Mietverhältnis anlegen',
                              onClick: () => {
                                setSelectedUnitForTenant(unit);
                                setShowTenantModal(true);
                              }
                            }] : []),
                            {
                              label: 'Bearbeiten',
                              onClick: () => openEditModal(unit)
                            },
                            {
                              label: 'Löschen',
                              onClick: () => handleDeleteUnit(unit),
                              variant: 'danger' as const
                            }
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showTenantModal && (
        <TenantModal
          tenant={null}
          properties={properties}
          onClose={() => {
            setShowTenantModal(false);
            setSelectedUnitForTenant(null);
          }}
          onSave={() => {
            setShowTenantModal(false);
            setSelectedUnitForTenant(null);
            loadUnits();
          }}
          preselectedPropertyId={propertyId}
          preselectedUnitId={selectedUnitForTenant?.id}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-dark">
                {editingUnit ? "Einheit bearbeiten" : "Einheit hinzufügen"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUnit(null);
                  resetForm();
                }}
                className="text-gray-300 hover:text-gray-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bezeichnung / Nummer *
                  </label>
                  <input
                    type="text"
                    value={formData.unit_number}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_number: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Typ *
                  </label>
                  <select
                    value={formData.unit_type}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_type: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="apartment">Wohnung</option>
                    <option value="office">Büro</option>
                    <option value="parking">Stellplatz</option>
                    <option value="storage">Lager</option>
                    <option value="commercial">Gewerbe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etage / Lage
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="z.B. 2. OG rechts, EG links"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fläche (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area_sqm}
                    onChange={(e) =>
                      setFormData({ ...formData, area_sqm: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zimmeranzahl
                  </label>
                  <input
                    type="number"
                    value={formData.rooms}
                    onChange={(e) =>
                      setFormData({ ...formData, rooms: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="vacant">Leer</option>
                    <option value="rented">Vermietet</option>
                    <option value="maintenance">Wartung</option>
                    <option value="self_occupied">Selbstnutzung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miteigentumsanteil (MEA)
                  </label>
                  <input
                    type="text"
                    value={formData.mea}
                    onChange={(e) =>
                      setFormData({ ...formData, mea: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="z.B. 50/1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Zusätzliche Informationen..."
                  />
                </div>

                <div className="col-span-2 pt-3 border-t border-gray-200 mt-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Laufende Kosten</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hausgeld (monatlich)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.hausgeld}
                      onChange={(e) =>
                        setFormData({ ...formData, hausgeld: e.target.value })
                      }
                      className="w-full px-4 py-2 pr-8 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="z.B. 350,00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                      &euro;
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Monatliche Hausgeldzahlung f&uuml;r diese Einheit.</p>
                </div>

                {ownershipType === "units_only" && (
                  <>
                    <div className="col-span-2 pt-3 border-t border-gray-200 mt-2">
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Kaufdaten</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kaufpreis (€)
                      </label>
                      <input
                        type="text"
                        value={formData.purchase_price}
                        onChange={(e) =>
                          setFormData({ ...formData, purchase_price: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="z.B. 250000 oder 250.000,50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aktueller Wert (€)
                      </label>
                      <input
                        type="text"
                        value={formData.current_value}
                        onChange={(e) =>
                          setFormData({ ...formData, current_value: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="z.B. 280000 oder 280.000,00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kaufdatum
                      </label>
                      <input
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) =>
                          setFormData({ ...formData, purchase_date: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2 pt-3 border-t border-gray-200 mt-2">
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Kaufnebenkosten</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maklerkosten (€)
                      </label>
                      <input
                        type="text"
                        value={formData.broker_costs}
                        onChange={(e) =>
                          setFormData({ ...formData, broker_costs: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="z.B. 7500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notarkosten (€)
                      </label>
                      <input
                        type="text"
                        value={formData.notary_costs}
                        onChange={(e) =>
                          setFormData({ ...formData, notary_costs: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="z.B. 3000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Anwaltskosten (€)
                      </label>
                      <input
                        type="text"
                        value={formData.lawyer_costs}
                        onChange={(e) =>
                          setFormData({ ...formData, lawyer_costs: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="z.B. 1500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grunderwerbsteuer (€)
                      </label>
                      <input
                        type="text"
                        value={formData.real_estate_transfer_tax}
                        onChange={(e) =>
                          setFormData({ ...formData, real_estate_transfer_tax: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="z.B. 15000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Eintragungskosten (€)
                      </label>
                      <input
                        type="text"
                        value={formData.registration_costs}
                        onChange={(e) =>
                          setFormData({ ...formData, registration_costs: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="z.B. 500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gutachterkosten (€)
                      </label>
                      <input
                        type="text"
                        value={formData.expert_costs}
                        onChange={(e) =>
                          setFormData({ ...formData, expert_costs: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="z.B. 800"
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                      <strong>Hinweis:</strong> Mieter werden einer Einheit über die Mieterdetails zugeordnet. Öffnen Sie die Mieterdetails und wählen Sie dort die gewünschte Einheit aus.
                    </p>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notizen
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUnit(null);
                    resetForm();
                  }}
                  variant="cancel"
                  fullWidth
                >
                  Abbrechen
                </Button>
                <Button type="submit" variant="primary" fullWidth>
                  {editingUnit ? "Speichern" : "Hinzufügen"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
