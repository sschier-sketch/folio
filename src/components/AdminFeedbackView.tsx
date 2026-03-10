import { useState, useEffect } from "react";
import {
  ThumbsUp,
  Euro,
  Filter,
  CheckCircle,
  Clock,
  Lightbulb,
  Package,
  Trash2,
  User,
  MessageCircle,
  Pencil,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { FeedbackCommentThread } from "./feedback/FeedbackCommentThread";

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
  comment_count: number;
  user_email?: string;
  user_name?: string;
  subscription_plan?: string;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editFeedbackText, setEditFeedbackText] = useState("");
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

      const feedbackItems: Feedback[] = data || [];

      if (feedbackItems.length > 0) {
        const userIds = [...new Set(feedbackItems.map((f) => f.user_id))];

        const [profilesRes, billingRes] = await Promise.all([
          supabase
            .from("account_profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", userIds),
          supabase
            .from("billing_info")
            .select("user_id, subscription_plan, trial_ends_at")
            .in("user_id", userIds),
        ]);

        const profilesMap = new Map(
          (profilesRes.data || []).map((p) => [p.user_id, p]),
        );
        const billingMap = new Map(
          (billingRes.data || []).map((b) => [b.user_id, b]),
        );

        for (const item of feedbackItems) {
          const profile = profilesMap.get(item.user_id);
          const billing = billingMap.get(item.user_id);

          if (profile?.first_name || profile?.last_name) {
            item.user_name = [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ");
          }

          if (billing) {
            if (billing.subscription_plan === "pro") {
              item.subscription_plan = "Pro";
            } else if (
              billing.trial_ends_at &&
              new Date(billing.trial_ends_at) > new Date()
            ) {
              item.subscription_plan = "Trial";
            } else {
              item.subscription_plan = "Free";
            }
          }
        }
      }

      setFeedbackList(feedbackItems);

      const { data: allFeedback, error: statsError } = await supabase
        .from("user_feedback")
        .select("status, willing_to_pay");

      if (statsError) throw statsError;

      setStats({
        total: allFeedback?.length || 0,
        pending: allFeedback?.filter((f) => f.status === "pending").length || 0,
        reviewed: allFeedback?.filter((f) => f.status === "reviewed").length || 0,
        planned: allFeedback?.filter((f) => f.status === "planned").length || 0,
        implemented: allFeedback?.filter((f) => f.status === "implemented").length || 0,
        willingToPay: allFeedback?.filter((f) => f.willing_to_pay).length || 0,
      });
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
    if (!confirm("Möchten Sie diesen Feedback-Eintrag wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("user_feedback")
        .delete()
        .eq("id", feedbackId);

      if (error) throw error;
      if (expandedId === feedbackId) setExpandedId(null);
      loadFeedback();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Fehler beim Löschen des Feedbacks");
    }
  };

  const handleEditFeedbackText = async (feedbackId: string) => {
    if (!editFeedbackText.trim()) return;

    try {
      const { error } = await supabase
        .from("user_feedback")
        .update({ feedback_text: editFeedbackText.trim() })
        .eq("id", feedbackId);

      if (error) throw error;
      setEditingFeedbackId(null);
      setEditFeedbackText("");
      loadFeedback();
    } catch (error) {
      console.error("Error editing feedback:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Ausstehend", color: "bg-amber-100 text-amber-700", icon: Clock },
      reviewed: { label: "Geprüft", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
      planned: { label: "Geplant", color: "bg-teal-100 text-teal-700", icon: Lightbulb },
      implemented: { label: "Umgesetzt", color: "bg-emerald-100 text-emerald-700", icon: Package },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 ${config.color} rounded-full text-xs font-medium`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const statCards = [
    { label: "Gesamt", value: stats.total, color: "text-dark", bgColor: "bg-gray-100", icon: Filter, iconColor: "text-gray-400" },
    { label: "Ausstehend", value: stats.pending, color: "text-amber-600", bgColor: "bg-amber-100", icon: Clock, iconColor: "text-amber-600" },
    { label: "Geprüft", value: stats.reviewed, color: "text-primary-blue", bgColor: "bg-primary-blue/10", icon: CheckCircle, iconColor: "text-primary-blue" },
    { label: "Geplant", value: stats.planned, color: "text-teal-600", bgColor: "bg-teal-100", icon: Lightbulb, iconColor: "text-teal-600" },
    { label: "Umgesetzt", value: stats.implemented, color: "text-emerald-600", bgColor: "bg-emerald-100", icon: Package, iconColor: "text-emerald-600" },
    { label: "Zahlungsbereit", value: stats.willingToPay, color: "text-emerald-600", bgColor: "bg-emerald-100", icon: Euro, iconColor: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
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
            <label className="block text-sm font-medium text-gray-400 mb-2">Zahlungsbereitschaft</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Alle</option>
              <option value="willing">Zahlungsbereit</option>
              <option value="not_willing">Nicht zahlungsbereit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Sortierung</label>
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
            {feedbackList.map((feedback) => {
              const isExpanded = expandedId === feedback.id;
              const isEditing = editingFeedbackId === feedback.id;

              return (
                <div
                  key={feedback.id}
                  className={`border rounded-lg transition-colors ${
                    isExpanded ? "border-primary-blue bg-gray-50/50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="p-4">
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
                          {feedback.comment_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                              <MessageCircle className="w-3 h-3" />
                              {feedback.comment_count}
                            </span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="mb-2 space-y-2">
                            <textarea
                              value={editFeedbackText}
                              onChange={(e) => setEditFeedbackText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                              rows={4}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditFeedbackText(feedback.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary-blue text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                Speichern
                              </button>
                              <button
                                onClick={() => {
                                  setEditingFeedbackId(null);
                                  setEditFeedbackText("");
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-dark mb-2 whitespace-pre-wrap">{feedback.feedback_text}</p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>
                            {new Date(feedback.created_at).toLocaleDateString("de-DE", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          {feedback.user_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {feedback.user_name}
                            </span>
                          )}
                          {feedback.subscription_plan && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                feedback.subscription_plan === "Pro"
                                  ? "bg-blue-100 text-blue-700"
                                  : feedback.subscription_plan === "Trial"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {feedback.subscription_plan}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={feedback.status}
                          onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        >
                          <option value="pending">Ausstehend</option>
                          <option value="reviewed">Geprüft</option>
                          <option value="planned">Geplant</option>
                          <option value="implemented">Umgesetzt</option>
                        </select>
                        <button
                          onClick={() => {
                            setEditingFeedbackId(feedback.id);
                            setEditFeedbackText(feedback.feedback_text);
                          }}
                          className="p-2 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded transition-colors"
                          title="Feedback-Text bearbeiten"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : feedback.id)}
                          className="p-2 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded transition-colors"
                          title="Kommentare anzeigen"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
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

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <FeedbackCommentThread
                        feedbackId={feedback.id}
                        isAdmin={true}
                        onCommentCountChange={(count) => {
                          setFeedbackList((prev) =>
                            prev.map((f) =>
                              f.id === feedback.id ? { ...f, comment_count: count } : f,
                            ),
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
