import { useState, useEffect } from "react";
import { X, Bell, Calendar } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useSubscription } from "../hooks/useSubscription";
import { Button } from "./ui/Button";

interface SystemUpdate {
  id: string;
  title: string;
  content: string;
  update_type: "free" | "premium";
  version: string | null;
  published_at: string;
  is_new?: boolean;
}

interface SystemUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UPDATES_PER_PAGE = 5;

export default function SystemUpdatesModal({
  isOpen,
  onClose,
}: SystemUpdatesModalProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [allUpdates, setAllUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isOpen && user) {
      loadUpdates();
    }
  }, [isOpen, user, isPremium]);

  async function loadUpdates() {
    if (!user) return;

    setLoading(true);
    try {
      const { data: viewedUpdates } = await supabase
        .from("user_update_views")
        .select("update_id")
        .eq("user_id", user.id);

      const viewedIds = viewedUpdates?.map((v) => v.update_id) || [];

      const { data: updatesData, error } = await supabase
        .from("system_updates")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;

      const filteredUpdates = (updatesData || [])
        .filter(
          (update) =>
            update.update_type === "free" ||
            (update.update_type === "premium" && isPremium)
        )
        .map((update) => ({
          ...update,
          is_new: !viewedIds.includes(update.id),
        }));

      setAllUpdates(filteredUpdates);
      setCurrentPage(1);

      const newUpdateIds = filteredUpdates
        .filter((u) => u.is_new)
        .map((u) => u.id);

      if (newUpdateIds.length > 0) {
        await supabase.from("user_update_views").insert(
          newUpdateIds.map((id) => ({
            user_id: user.id,
            update_id: id,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading updates:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalPages = Math.ceil(allUpdates.length / UPDATES_PER_PAGE);
  const startIndex = (currentPage - 1) * UPDATES_PER_PAGE;
  const endIndex = startIndex + UPDATES_PER_PAGE;
  const currentUpdates = allUpdates.slice(startIndex, endIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary-blue" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-dark">
                Was ist neu?
              </h3>
              <p className="text-sm text-gray-400">
                Aktuelle Updates und Funktionen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-dark hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
            </div>
          ) : allUpdates.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-dark mb-2">
                Keine Updates
              </h4>
              <p className="text-gray-400">
                Aktuell gibt es keine neuen Updates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentUpdates.map((update) => (
                <div
                  key={update.id}
                  className={`p-4 rounded-lg border-2 ${
                    update.is_new
                      ? "border-primary-blue bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className="text-lg font-semibold text-dark">
                        {update.title}
                      </h4>
                      {update.is_new && (
                        <span className="px-2 py-0.5 bg-primary-blue text-white text-xs font-medium rounded">
                          Neu
                        </span>
                      )}
                    </div>
                    {update.version && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 ml-4">
                        v{update.version}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">
                    {update.content}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(update.published_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="cancel"
            >
              Zurück
            </Button>
            <span className="text-sm text-gray-400">
              Seite {currentPage} von {totalPages}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              variant="cancel"
            >
              Weiter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
