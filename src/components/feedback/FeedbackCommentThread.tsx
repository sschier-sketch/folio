import { useState, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Pencil,
  Trash2,
  Shield,
  X,
  Check,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Comment {
  id: string;
  feedback_id: string;
  user_id: string;
  comment_text: string;
  is_admin_comment: boolean;
  edited_at: string | null;
  created_at: string;
  user_name?: string;
}

interface FeedbackCommentThreadProps {
  feedbackId: string;
  isAdmin?: boolean;
  onCommentCountChange?: (count: number) => void;
}

export function FeedbackCommentThread({
  feedbackId,
  isAdmin = false,
  onCommentCountChange,
}: FeedbackCommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    loadComments();
  }, [feedbackId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback_comments")
        .select("*")
        .eq("feedback_id", feedbackId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const items: Comment[] = data || [];

      if (items.length > 0) {
        const userIds = [...new Set(items.map((c) => c.user_id))];
        const { data: profiles } = await supabase
          .from("account_profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p]),
        );

        for (const item of items) {
          const profile = profileMap.get(item.user_id);
          if (profile?.first_name || profile?.last_name) {
            item.user_name = [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ");
          }
        }
      }

      setComments(items);
      onCommentCountChange?.(items.length);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback_comments").insert({
        feedback_id: feedbackId,
        user_id: user.id,
        comment_text: newComment.trim(),
        is_admin_comment: isAdmin,
      });

      if (error) throw error;
      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from("feedback_comments")
        .update({
          comment_text: editText.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq("id", commentId);

      if (error) throw error;
      setEditingId(null);
      setEditText("");
      await loadComments();
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Kommentar wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("feedback_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      await loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  const canModify = (comment: Comment) => {
    return isAdmin || comment.user_id === user?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Kommentare laden...
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">
          {comments.length} {comments.length === 1 ? "Kommentar" : "Kommentare"}
        </span>
      </div>

      {comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-lg p-3 ${
                comment.is_admin_comment
                  ? "bg-blue-50 border border-blue-100"
                  : "bg-gray-50 border border-gray-100"
              }`}
            >
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(comment.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-primary-blue text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      Speichern
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      {comment.is_admin_comment && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold uppercase">
                          <Shield className="w-2.5 h-2.5" />
                          Team
                        </span>
                      )}
                      <span className="text-xs font-medium text-gray-700">
                        {comment.user_name || "Nutzer"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString("de-DE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {comment.edited_at && (
                        <span className="text-[10px] text-gray-400 italic">
                          (bearbeitet)
                        </span>
                      )}
                    </div>
                    {canModify(comment) && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEdit(comment)}
                          className="p-1 text-gray-400 hover:text-primary-blue rounded transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            isAdmin
              ? "Als Admin kommentieren..."
              : "Kommentar schreiben..."
          }
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !newComment.trim()}
          className="self-end p-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Kommentar senden"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
