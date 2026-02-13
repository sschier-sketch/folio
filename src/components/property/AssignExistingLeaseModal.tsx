import { useState, useEffect } from "react";
import { X, Search, Users, Home, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

interface ExistingLease {
  id: string;
  tenant_id: string;
  property_id: string;
  base_rent: number;
  total_rent: number;
  contract_start: string;
  contract_end: string | null;
  status: string;
  tenant_name: string;
  property_name: string;
  unit_names: string[];
}

interface AssignExistingLeaseModalProps {
  propertyId: string;
  unitId: string;
  unitNumber: string;
  onClose: () => void;
  onSave: () => void;
}

export default function AssignExistingLeaseModal({
  propertyId,
  unitId,
  unitNumber,
  onClose,
  onSave,
}: AssignExistingLeaseModalProps) {
  const { user } = useAuth();
  const [leases, setLeases] = useState<ExistingLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) loadLeases();
  }, [user]);

  async function loadLeases() {
    try {
      setLoading(true);
      const { data: contracts, error } = await supabase
        .from("rental_contracts")
        .select("id, tenant_id, property_id, base_rent, total_rent, contract_start, contract_end, status, tenants(id, first_name, last_name), properties(id, name)")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("contract_start", { ascending: false });

      if (error) throw error;

      const leasesWithUnits: ExistingLease[] = [];

      for (const contract of contracts || []) {
        const tenant = contract.tenants as any;
        const property = contract.properties as any;

        const { data: rcuData } = await supabase
          .from("rental_contract_units")
          .select("unit_id, property_units(unit_number)")
          .eq("contract_id", contract.id);

        const unitNames = (rcuData || [])
          .map((rcu: any) => rcu.property_units?.unit_number)
          .filter(Boolean);

        leasesWithUnits.push({
          id: contract.id,
          tenant_id: contract.tenant_id,
          property_id: contract.property_id,
          base_rent: Number(contract.base_rent) || 0,
          total_rent: Number(contract.total_rent) || 0,
          contract_start: contract.contract_start,
          contract_end: contract.contract_end,
          status: contract.status,
          tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unbekannt",
          property_name: property?.name || "Unbekannt",
          unit_names: unitNames,
        });
      }

      setLeases(leasesWithUnits);
    } catch (error) {
      console.error("Error loading leases:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign() {
    if (!selectedLeaseId || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("rental_contract_units")
        .insert({
          contract_id: selectedLeaseId,
          unit_id: unitId,
          user_id: user.id,
        });

      if (error) throw error;

      onSave();
    } catch (error: any) {
      console.error("Error assigning lease:", error);
      if (error?.code === "23505") {
        alert("Diese Einheit ist bereits diesem Mietverhältnis zugeordnet.");
      } else {
        alert("Fehler beim Zuordnen des Mietverhältnisses.");
      }
    } finally {
      setSaving(false);
    }
  }

  const filteredLeases = leases.filter((lease) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lease.tenant_name.toLowerCase().includes(term) ||
      lease.property_name.toLowerCase().includes(term) ||
      lease.unit_names.some((u) => u.toLowerCase().includes(term))
    );
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="border-b px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-dark">
              Bestehendes Mietverh&auml;ltnis zuordnen
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Einheit: <span className="font-medium text-gray-600">{unitNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="text"
              placeholder="Mieter oder Immobilie suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Lade Mietverh&auml;ltnisse...</div>
          ) : filteredLeases.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">
                {searchTerm
                  ? "Keine Mietverhältnisse gefunden"
                  : "Keine aktiven Mietverhältnisse vorhanden"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeases.map((lease) => (
                <button
                  key={lease.id}
                  type="button"
                  onClick={() => setSelectedLeaseId(lease.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedLeaseId === lease.id
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-semibold text-dark truncate">
                          {lease.tenant_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Home className="w-4 h-4 text-gray-300 shrink-0" />
                        <span className="text-sm text-gray-500 truncate">
                          {lease.property_name}
                          {lease.unit_names.length > 0 && (
                            <span className="text-gray-400">
                              {" "}| {lease.unit_names.join(", ")}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>ab {formatDate(lease.contract_start)}</span>
                        {lease.contract_end && (
                          <span>bis {formatDate(lease.contract_end)}</span>
                        )}
                        <span className="font-medium text-gray-600">
                          {formatCurrency(lease.total_rent)} / Monat
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 ml-3">
                      {selectedLeaseId === lease.id ? (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex gap-3 shrink-0">
          <Button type="button" onClick={onClose} variant="cancel" fullWidth>
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            variant="primary"
            fullWidth
            disabled={!selectedLeaseId || saving}
          >
            {saving ? "Wird zugeordnet..." : "Mietverhältnis zuordnen"}
          </Button>
        </div>
      </div>
    </div>
  );
}
