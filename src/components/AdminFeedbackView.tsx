import { useState, useEffect } from "react";
import {
  ThumbsUp,
  Euro,
  Filter,
  CheckCircle,
  Clock,
  Lightbulb,
  Package,
  X,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface Feedback {
  id: string;
  user_id: string;
  feedback_text: string;
  willing_to_pay: boolean;
  payment_amount: string | null;
  status: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  net_votes: number;
}

type StatusFilter = "all" | "pending" | "reviewed" | "planned" | "implemented";
type PaymentFilter = "all" | "willing" | "not_willing";
type SortType = "date" | "votes" | "payment";

export function AdminFeedbackView() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [sortBy, setSortBy] = useState<SortType>("date");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    planned: 0,
    implemented: 0,
    willingToPay: 0,
  });

  useEffect(() => {
    loadFeedback();
  }, [statusFilter, paymentFilter, sortBy]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase.from("user_feedback").select("*");

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (paymentFilter === "willing") {
        query = query.eq("willing_to_pay", true);
      } else if (paymentFilter === "not_willing") {
        query = query.eq("willing_to_pay", false);
      }

      if (sortBy === "votes") {
        query = query.order("net_votes", { ascending: false });
      } else if (sortBy === "payment") {
        query = query.order("payment_amount", {
          ascending: false,
          nullsFirst: false,
        });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setFeedbackList(data || []);

      const { data: allFeedback, error: statsError } = await supabase
        .from("user_feedback")
        .select("status, willing_to_pay");

      if (statsError) throw statsError;

      const stats = {
        total: allFeedback?.length || 0,
        pending:
          allFeedback?.filter((f) => f.status === "pending").length || 0,
        reviewed:
          allFeedback?.filter((f) => f.status === "reviewed").length || 0,
        planned:
          allFeedback?.filter((f) => f.status === "planned").length || 0,
        implemented:
          allFeedback?.filter((f) => f.status === "implemented").length || 0,
        willingToPay:
          allFeedback?.filter((f) => f.willing_to_pay).length || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error("Error loading feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("user_feedback")
        .update({ status: newStatus })
        .eq("id", feedbackId);

      if (error) throw error;

      loadFeedback();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm("Möchten Sie diesen Feedback-Eintrag wirklich löschen?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("user_feedback")
        .delete()
        .eq("id", feedbackId);

      if (error) throw error;

      loadFeedback();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Fehler beim Löschen des Feedbacks");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: "Ausstehend",
        color: "bg-amber-100 text-amber-700",
        icon: Clock,
      },
      reviewed: {
        label: "Geprüft",
        color: "bg-blue-100 text-blue-700",
        icon: CheckCircle,
      },
      planned: {
        label: "Geplant",
        color: "bg-primary-blue/10 text-primary-blue",
        icon: Lightbulb,
      },
      implemented: {
        label: "Umgesetzt",
        color: "bg-emerald-100 text-emerald-700",
        icon: Package,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 ${config.color} rounded text-xs font-medium`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Gesamt</p>
              <p className="text-2xl font-bold text-dark">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Ausstehend</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.pending}
              </p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Geprüft</p>
              <p className="text-2xl font-bold text-primary-blue">
                {stats.reviewed}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-blue/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary-blue" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Geplant</p>
              <p className="text-2xl font-bold text-primary-blue">
                {stats.planned}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-blue/10 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary-blue" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Umgesetzt</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.implemented}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Zahlungsbereit</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.willingToPay}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Euro className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Alle</option>
              <option value="pending">Ausstehend</option>
              <option value="reviewed">Geprüft</option>
              <option value="planned">Geplant</option>
              <option value="implemented">Umgesetzt</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Zahlungsbereitschaft
            </label>
            <select
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(e.target.value as PaymentFilter)
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Alle</option>
              <option value="willing">Zahlungsbereit</option>
              <option value="not_willing">Nicht zahlungsbereit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Sortierung
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="date">Datum</option>
              <option value="votes">Votes</option>
              <option value="payment">Zahlungsbetrag</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="text-center py-8">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Kein Feedback gefunden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((feedback) => (
              <div
                key={feedback.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-blue transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(feedback.status)}
                      {feedback.willing_to_pay && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                          <Euro className="w-3 h-3" />
                          {feedback.payment_amount || "Betrag nicht angegeben"}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        <ThumbsUp className="w-3 h-3" />
                        {feedback.upvotes - feedback.downvotes}
                      </span>
                    </div>
                    <p className="text-dark mb-2">{feedback.feedback_text}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(feedback.created_at).toLocaleDateString(
                        "de-DE",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={feedback.status}
                      onChange={(e) =>
                        handleStatusChange(feedback.id, e.target.value)
                      }
                      className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    >
                      <option value="pending">Ausstehend</option>
                      <option value="reviewed">Geprüft</option>
                      <option value="planned">Geplant</option>
                      <option value="implemented">Umgesetzt</option>
                    </select>
                    <button
                      onClick={() => handleDeleteFeedback(feedback.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Feedback löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
