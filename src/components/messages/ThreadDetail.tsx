import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, User, UserPlus, Flag, Trash2, RotateCcw, FileSignature } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AssignSenderModal from './AssignSenderModal';
import type { MailThread, MailMessage, TicketPriority, TicketCategory } from './types';

const priorityConfig: Record<TicketPriority, { color: string; bg: string; border: string; label: string }> = {
  low: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Niedrig' },
  medium: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Mittel' },
  high: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'Dringend' },
};

const categoryLabels: Record<TicketCategory, string> = {
  general: 'Allgemein',
  maintenance: 'Wartung',
  repair: 'Reparatur',
  complaint: 'Beschwerde',
  question: 'Frage',
};

interface ThreadDetailProps {
  thread: MailThread;
  userAlias: string;
  onBack: () => void;
  onMessageSent: () => void;
  onTrash: () => void;
  onRestore?: () => void;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ThreadDetail({ thread, userAlias, onBack, onMessageSent, onTrash, onRestore }: ThreadDetailProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [signature, setSignature] = useState('');
  const [appendSignature, setAppendSignature] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recipientName = thread.tenants
    ? `${thread.tenants.first_name} ${thread.tenants.last_name}`.trim()
    : thread.external_name || thread.external_email || 'Unbekannt';

  const recipientEmail = thread.tenants?.email || thread.external_email || '';

  useEffect(() => {
    loadMessages();
    loadMailSettings();
    const timer = setTimeout(markAsRead, 1500);
    return () => clearTimeout(timer);
  }, [thread.id]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase
      .from('mail_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    setLoading(false);
  }

  async function loadMailSettings() {
    if (!user) return;
    const { data } = await supabase
      .from('user_mail_settings')
      .select('signature, signature_default_on')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setSignature(data.signature || '');
      setAppendSignature(data.signature_default_on ?? true);
    }
  }

  async function markAsRead() {
    if (thread.status === 'unread') {
      await supabase
        .from('mail_threads')
        .update({ status: 'read', updated_at: new Date().toISOString() })
        .eq('id', thread.id);
    }
  }

  async function handleSendReply() {
    if (!replyText.trim() || !user) return;
    setSending(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let fullText = replyText.trim();
      if (appendSignature && signature.trim()) {
        fullText += '\n\n--\n' + signature.trim();
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `Re: ${thread.subject || ''}`.trim(),
          text: fullText,
          userId: user.id,
          useUserAlias: true,
          storeAsMessage: true,
          threadId: thread.id,
          recipientName,
          tenantId: thread.tenant_id || undefined,
          mailType: 'user_message',
          category: 'transactional',
        }),
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        if (thread.tenant_id) {
          await supabase.from('tenant_communications').insert({
            user_id: user.id,
            tenant_id: thread.tenant_id,
            communication_type: 'message',
            subject: thread.subject || 'Antwort',
            content: replyText.trim(),
            is_internal: !thread.ticket_id,
          });
        }

        setReplyText('');
        onMessageSent();
        loadMessages();
      }
    } catch {
      // silent fail
    }

    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <button onClick={onBack} className="lg:hidden p-1 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="animate-pulse flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-32" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
            {getInitials(recipientName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {thread.priority && (
                <Flag className={`w-3.5 h-3.5 flex-shrink-0 ${priorityConfig[thread.priority].color}`} fill="currentColor" />
              )}
              <h3 className="font-semibold text-gray-900 text-sm truncate">{recipientName}</h3>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500 truncate">{recipientEmail || thread.subject}</p>
              {thread.category && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 flex-shrink-0">
                  {categoryLabels[thread.category as TicketCategory] || thread.category}
                </span>
              )}
              {thread.priority && (
                <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border flex-shrink-0 ${priorityConfig[thread.priority].bg} ${priorityConfig[thread.priority].color} ${priorityConfig[thread.priority].border}`}>
                  {priorityConfig[thread.priority].label}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {thread.folder === 'unknown' && (
              <button
                onClick={() => setShowAssign(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Zuordnen
              </button>
            )}
            {onRestore ? (
              <button
                onClick={onRestore}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                title="Wiederherstellen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Wiederherstellen
              </button>
            ) : (
              <button
                onClick={onTrash}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                title="In Papierkorb verschieben"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => {
          const isOutbound = msg.direction === 'outbound';
          return (
            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isOutbound ? 'order-1' : 'order-1'}`}>
                <div className={`flex items-center gap-2 mb-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                  {!isOutbound && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                  <span className="text-[11px] text-gray-400">
                    {isOutbound ? 'Du' : (msg.sender_name || msg.sender_address || recipientName)}
                    {' -- '}
                    {formatDateTime(msg.created_at)}
                  </span>
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isOutbound
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.body_text}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {thread.folder !== 'trash' && (
        <div className="px-5 py-3 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex gap-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              placeholder="Nachricht schreiben..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim() || sending}
              className="self-end px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Senden</span>
            </button>
          </div>
          {signature.trim() && (
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={appendSignature}
                onChange={(e) => setAppendSignature(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <FileSignature className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">Signatur anhaengen</span>
            </label>
          )}
        </div>
      )}

      <AssignSenderModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        thread={thread}
        onAssigned={onMessageSent}
      />
    </div>
  );
}
