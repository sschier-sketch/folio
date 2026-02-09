import { useState, useEffect } from "react";
import { Plus, Calendar, FileText, Edit, Copy, Trash2, Eye, Filter } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import TableActionsDropdown, { ActionItem } from "../common/TableActionsDropdown";
import { Button } from '../ui/Button';

interface HandoverProtocol {
  id: string;
  protocol_type: "move_in" | "move_out";
  handover_date: string;
  status: "draft" | "final";
  tenant_name: string | null;
  notes: string | null;
  created_at: string;
  property_id: string | null;
  unit_id: string | null;
  contract_id: string | null;
}

interface HandoverProtocolsListProps {
  tenantId?: string;
  onClose?: () => void;
}

export default function HandoverProtocolsList({ tenantId, onClose }: HandoverProtocolsListProps) {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<HandoverProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<HandoverProtocol | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail" | "compare">("list");
  const [filterType, setFilterType] = useState<"all" | "move_in" | "move_out">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "final">("all");

  useEffect(() => {
    if (user) {
      loadProtocols();
    }
  }, [user, tenantId]);

  async function loadProtocols() {
    try {
      setLoading(true);
      let query = supabase
        .from("handover_protocols")
        .select("*")
        .eq("user_id", user!.id)
        .order("handover_date", { ascending: false });

      if (tenantId) {
        query = query.eq("contract_id", tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProtocols(data || []);
    } catch (error) {
      console.error("Error loading protocols:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Möchten Sie dieses Protokoll wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("handover_protocols")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await loadProtocols();
      alert("Protokoll erfolgreich gelöscht");
    } catch (error) {
      console.error("Error deleting protocol:", error);
      alert("Fehler beim Löschen des Protokolls");
    }
  }

  async function handleDuplicate(protocol: HandoverProtocol) {
    try {
      const { id, created_at, ...protocolData } = protocol;

      const { data: newProtocol, error } = await supabase
        .from("handover_protocols")
        .insert([{
          ...protocolData,
          status: "draft",
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      const { data: checklists } = await supabase
        .from("handover_checklists")
        .select("*")
        .eq("protocol_id", id);

      if (checklists && checklists.length > 0) {
        await supabase
          .from("handover_checklists")
          .insert(checklists.map(cl => ({
            protocol_id: newProtocol.id,
            title: cl.title,
            items: cl.items,
          })));
      }

      const { data: readings } = await supabase
        .from("handover_meter_readings")
        .select("*")
        .eq("protocol_id", id);

      if (readings && readings.length > 0) {
        await supabase
          .from("handover_meter_readings")
          .insert(readings.map(r => ({
            protocol_id: newProtocol.id,
            meter_type: r.meter_type,
            meter_number: r.meter_number,
            reading: r.reading,
            unit: r.unit,
            reading_date: r.reading_date,
          })));
      }

      await loadProtocols();
      alert("Protokoll erfolgreich dupliziert");
    } catch (error) {
      console.error("Error duplicating protocol:", error);
      alert("Fehler beim Duplizieren des Protokolls");
    }
  }

  const filteredProtocols = protocols.filter((protocol) => {
    if (filterType !== "all" && protocol.protocol_type !== filterType) return false;
    if (filterStatus !== "all" && protocol.status !== filterStatus) return false;
    return true;
  });

  const typeLabels = {
    move_in: "Einzug",
    move_out: "Auszug",
  };

  const statusLabels = {
    draft: "Entwurf",
    final: "Final",
  };

  const statusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    final: "bg-green-100 text-green-800",
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-dark">Übergabeprotokolle</h2>
        <Button
          onClick={() => setShowForm(true)}
          variant="primary"
        >
          <Plus className="w-5 h-5" />
          Neues Protokoll
        </Button>
      </div>

      <div className="bg-white rounded-lg p-4 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Typ
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="all">Alle Typen</option>
            <option value="move_in">Einzug</option>
            <option value="move_out">Auszug</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="all">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="final">Final</option>
          </select>
        </div>
      </div>

      {filteredProtocols.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Keine Übergabeprotokolle vorhanden
          </h3>
          <p className="text-gray-500 mb-6">
            Erstellen Sie Ihr erstes Protokoll mit Zählerständen, Checkliste und Fotos
          </p>
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
          >
            Erstes Protokoll erstellen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProtocols.map((protocol) => (
            <div
              key={protocol.id}
              className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {typeLabels[protocol.protocol_type]}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[protocol.status]}`}>
                      {statusLabels[protocol.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(protocol.handover_date).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  {protocol.tenant_name && (
                    <div className="text-sm text-gray-600 mb-2">
                      Mieter: {protocol.tenant_name}
                    </div>
                  )}
                  {protocol.notes && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {protocol.notes}
                    </p>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    Erstellt: {new Date(protocol.created_at).toLocaleDateString("de-DE")}
                  </div>
                </div>
                <div className="ml-4">
                  <TableActionsDropdown
                    actions={[
                      {
                        label: 'Anzeigen',
                        onClick: () => {
                          setSelectedProtocol(protocol);
                          setViewMode("detail");
                        }
                      },
                      {
                        label: 'Bearbeiten',
                        onClick: () => {
                          setSelectedProtocol(protocol);
                          setShowForm(true);
                        }
                      },
                      {
                        label: 'Duplizieren',
                        onClick: () => handleDuplicate(protocol)
                      },
                      {
                        label: 'Löschen',
                        onClick: () => handleDelete(protocol.id),
                        variant: 'danger' as const
                      }
                    ]}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
