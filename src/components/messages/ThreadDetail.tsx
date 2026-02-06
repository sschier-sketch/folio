import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, User, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AssignSenderModal from './AssignSenderModal';
import type { MailThread, MailMessage } from './types';

interface ThreadDetailProps {
  thread: MailThread;
  userAlias: string;
  onBack: () => void;
  onMessageSent: () => void;
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

export default function ThreadDetail({ thread, userAlias, onBack, onMessageSent }: ThreadDetailProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recipientName = thread.tenants
    ? `${thread.tenants.first_name} ${thread.tenants.last_name}`.trim()
    : thread.external_name || thread.external_email || 'Unbekannt';

  const recipientEmail = thread.tenants?.email || thread.external_email || '';

  useEffect(() => {
    loadMessages();
    markAsRead();
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

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `Re: ${thread.subject || ''}`.trim(),
          text: replyText.trim(),
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
            is_internal: false,
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
            <h3 className="font-semibold text-gray-900 text-sm truncate">{recipientName}</h3>
            <p className="text-xs text-gray-500 truncate">{recipientEmail || thread.subject}</p>
          </div>
          {thread.folder === 'unknown' && (
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex-shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Zuordnen
            </button>
          )}
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

      <div className="px-5 py-4 border-t border-gray-200 bg-white flex-shrink-0">
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
      </div>

      <AssignSenderModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        thread={thread}
        onAssigned={onMessageSent}
      />
    </div>
  );
}
