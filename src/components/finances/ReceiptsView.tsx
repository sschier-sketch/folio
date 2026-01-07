import { useState, useEffect } from "react";
import { Receipt, Upload, Link as LinkIcon, Archive } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface ReceiptItem {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  status: string;
  expense_id: string | null;
  uploaded_at: string;
}

export default function ReceiptsView() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user) {
      loadReceipts();
    }
  }, [user, filter]);

  async function loadReceipts() {
    try {
      setLoading(true);

      let query = supabase
        .from("receipts")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data } = await query;

      if (data) setReceipts(data);
    } catch (error) {
      console.error("Error loading receipts:", error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-amber-100 text-amber-700";
      case "booked":
        return "bg-emerald-100 text-emerald-700";
      case "archived":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Offen";
      case "booked":
        return "Gebucht";
      case "archived":
        return "Archiviert";
      default:
        return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <Receipt className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {receipts.filter((r) => r.status === "open").length}
          </div>
          <div className="text-sm text-gray-400">Offene Belege</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <Receipt className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {receipts.filter((r) => r.status === "booked").length}
          </div>
          <div className="text-sm text-gray-400">Gebuchte Belege</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Archive className="w-6 h-6 text-gray-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {receipts.filter((r) => r.status === "archived").length}
          </div>
          <div className="text-sm text-gray-400">Archivierte Belege</div>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-dark">Belege</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-primary-blue text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilter("open")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === "open"
                    ? "bg-primary-blue text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Offen
              </button>
              <button
                onClick={() => setFilter("booked")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === "booked"
                    ? "bg-primary-blue text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Gebucht
              </button>
              <button
                onClick={() => setFilter("archived")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === "archived"
                    ? "bg-primary-blue text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Archiviert
              </button>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors">
            <Upload className="w-4 h-4" />
            Beleg hochladen
          </button>
        </div>

        {receipts.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Keine Belege vorhanden</p>
            <button className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Ersten Beleg hochladen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Dateiname
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Größe
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Hochgeladen
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Verknüpft
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-gray-100">
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        {receipt.file_name}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">
                      {formatFileSize(receipt.file_size)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">
                      {new Date(receipt.uploaded_at).toLocaleDateString(
                        "de-DE"
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          receipt.status
                        )}`}
                      >
                        {getStatusLabel(receipt.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {receipt.expense_id ? (
                        <div className="flex items-center justify-center gap-1 text-emerald-600">
                          <LinkIcon className="w-4 h-4" />
                          <span className="text-xs">Verknüpft</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Nicht verknüpft
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
