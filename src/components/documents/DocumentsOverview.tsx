import { useState, useEffect } from "react";
import { FileText, FolderCheck, HardDrive, Upload, Clock, TrendingUp } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface DocumentsOverviewProps {
  onNavigateToUpload: () => void;
  onNavigateToList: () => void;
}

interface Stats {
  totalDocuments: number;
  assignedDocuments: number;
  unassignedDocuments: number;
  totalSize: number;
  recentUploads: number;
}

interface RecentActivity {
  id: string;
  action: string;
  documentName: string;
  timestamp: string;
}

export default function DocumentsOverview({ onNavigateToUpload, onNavigateToList }: DocumentsOverviewProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    assignedDocuments: 0,
    unassignedDocuments: 0,
    totalSize: 0,
    recentUploads: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
      loadRecentActivities();
    }
  }, [user]);

  async function loadStats() {
    try {
      const { data: documents } = await supabase
        .from("documents")
        .select("id, file_size, is_archived, upload_date")
        .eq("is_archived", false);

      if (documents) {
        const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);

        const { data: associations } = await supabase
          .from("document_associations")
          .select("document_id");

        const assignedDocIds = new Set(associations?.map(a => a.document_id) || []);
        const assignedCount = documents.filter(d => assignedDocIds.has(d.id)).length;

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const recentCount = documents.filter(
          d => new Date(d.upload_date) > lastWeek
        ).length;

        setStats({
          totalDocuments: documents.length,
          assignedDocuments: assignedCount,
          unassignedDocuments: documents.length - assignedCount,
          totalSize,
          recentUploads: recentCount,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentActivities() {
    try {
      const { data: history } = await supabase
        .from("document_history")
        .select(`
          id,
          action,
          created_at,
          changes,
          documents!inner(file_name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (history) {
        const activities: RecentActivity[] = history.map((h: any) => ({
          id: h.id,
          action: h.action,
          documentName: h.documents?.file_name || "Unbekannt",
          timestamp: h.created_at,
        }));
        setRecentActivities(activities);
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: "Hochgeladen",
      updated: "Aktualisiert",
      archived: "Archiviert",
      restored: "Wiederhergestellt",
      associated: "Zugeordnet",
      disassociated: "Zuordnung entfernt",
    };
    return labels[action] || action;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Gerade eben";
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffMins < 1440) return `vor ${Math.floor(diffMins / 60)} Std.`;
    return `vor ${Math.floor(diffMins / 1440)} Tag(en)`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">{stats.totalDocuments}</div>
          <div className="text-sm text-gray-500">Dokumente gesamt</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FolderCheck className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-dark mb-1">{stats.assignedDocuments}</div>
          <div className="text-sm text-gray-500">Zugeordnet</div>
          <div className="text-xs text-gray-400 mt-2">
            {stats.unassignedDocuments} offen
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-dark mb-1">{formatFileSize(stats.totalSize)}</div>
          <div className="text-sm text-gray-500">Speicherplatz genutzt</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-violet-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-dark mb-1">{stats.recentUploads}</div>
          <div className="text-sm text-gray-500">Letzte 7 Tage</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-dark mb-4">Letzte Aktivitäten</h3>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Noch keine Aktivitäten vorhanden
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark font-medium truncate">
                      {activity.documentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getActionLabel(activity.action)} • {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-dark mb-4">Schnellaktionen</h3>
          <div className="space-y-3">
            <button
              onClick={onNavigateToUpload}
              className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-dark">Dokument hochladen</div>
                <div className="text-sm text-gray-500">Neue Datei hinzufügen</div>
              </div>
            </button>

            <button
              onClick={onNavigateToList}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-dark">Alle Dokumente</div>
                <div className="text-sm text-gray-500">Zur Dokumentenliste</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {stats.unassignedDocuments > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 mb-1">
                {stats.unassignedDocuments} Dokument{stats.unassignedDocuments !== 1 ? "e" : ""} ohne Zuordnung
              </h4>
              <p className="text-sm text-amber-700">
                Ordnen Sie Dokumente Immobilien, Mietverhältnissen oder Mietern zu, um sie leichter wiederzufinden.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
