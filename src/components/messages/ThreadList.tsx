import { Mail, Flag } from 'lucide-react';
import type { MailThread, TicketPriority, TicketCategory } from './types';

interface ThreadListProps {
  threads: MailThread[];
  selectedThreadId: string | null;
  onSelect: (thread: MailThread) => void;
  loading: boolean;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) return `${diffDays} Tage`;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function getDisplayName(thread: MailThread): string {
  if (thread.tenants) {
    return `${thread.tenants.first_name} ${thread.tenants.last_name}`.trim();
  }
  if (thread.external_name) return thread.external_name;
  if (thread.external_email) return thread.external_email;
  return 'Unbekannt';
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const priorityConfig: Record<TicketPriority, { color: string; bg: string; label: string }> = {
  low: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Niedrig' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Mittel' },
  high: { color: 'text-red-600', bg: 'bg-red-50', label: 'Hoch' },
};

const categoryLabels: Record<TicketCategory, string> = {
  general: 'Allgemein',
  maintenance: 'Wartung',
  repair: 'Reparatur',
  complaint: 'Beschwerde',
  question: 'Frage',
};

export default function ThreadList({ threads, selectedThreadId, onSelect, loading }: ThreadListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3 p-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Mail className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Keine Nachrichten</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {threads.map((thread) => {
        const isSelected = selectedThreadId === thread.id;
        const isUnread = thread.status === 'unread';
        const name = getDisplayName(thread);
        const initials = getInitials(name);

        return (
          <button
            key={thread.id}
            onClick={() => onSelect(thread)}
            className={`w-full text-left px-4 py-3.5 flex gap-3 transition-colors ${
              isSelected
                ? 'bg-blue-50 border-l-2 border-blue-600'
                : isUnread
                  ? 'bg-white hover:bg-gray-50 border-l-2 border-transparent'
                  : 'bg-white hover:bg-gray-50 border-l-2 border-transparent'
            }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
              isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {thread.priority && (
                    <Flag className={`w-3 h-3 flex-shrink-0 ${priorityConfig[thread.priority].color}`} fill="currentColor" />
                  )}
                  <span className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {name}
                  </span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatRelativeDate(thread.last_message_at)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-xs truncate ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                  {thread.subject}
                </p>
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {thread.category && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
                    {categoryLabels[thread.category] || thread.category}
                  </span>
                )}
                {thread.message_count > 1 && (
                  <span className="text-[10px] text-gray-400">
                    {thread.message_count} Nachrichten
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
