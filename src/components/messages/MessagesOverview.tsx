import { useState } from 'react';
import {
  Mail,
  MailOpen,
  Send,
  Inbox,
  AlertTriangle,
  X,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import type { Folder } from './types';

interface MessagesOverviewProps {
  email: string;
  unreadCount: number;
  sentCount: number;
  totalCount: number;
  onNavigateFolder: (folder: Folder) => void;
}

export default function MessagesOverview({
  email,
  unreadCount,
  sentCount,
  totalCount,
  onNavigateFolder,
}: MessagesOverviewProps) {
  const [showSpamNotice, setShowSpamNotice] = useState(true);

  return (
    <div className="space-y-6">
      {showSpamNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 mb-1">Spam-Schutz aktiv</h4>
              <p className="text-sm text-amber-700">
                E-Mails von unbekannten Absendern werden im Ordner "Unbekannt" gesammelt und
                können dort zugeordnet werden. So bleiben Ihre Konversationen übersichtlich und Spam-frei.
              </p>
            </div>
            <button
              onClick={() => setShowSpamNotice(false)}
              className="p-1 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>
      )}

      {unreadCount === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium text-emerald-700">
              Alles erledigt. Keine ungelesenen Nachrichten.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <MailOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-700">
              {unreadCount} ungelesene {unreadCount === 1 ? 'Nachricht wartet' : 'Nachrichten warten'} auf Sie.
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-dark mb-1">Ihre E-Mail-Adresse</h3>
        <div className="flex items-center gap-2 mt-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">{email || 'Noch nicht eingerichtet'}</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-dark mb-4">Postfächer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FolderCard
            icon={<Inbox className="w-6 h-6" style={{ color: '#1E1E24' }} strokeWidth={1.5} />}
            label="Posteingang"
            count={totalCount - sentCount}
            unread={unreadCount}
            onClick={() => onNavigateFolder('inbox')}
          />
          <FolderCard
            icon={<Send className="w-6 h-6" style={{ color: '#1E1E24' }} strokeWidth={1.5} />}
            label="Gesendet"
            count={sentCount}
            unread={0}
            onClick={() => onNavigateFolder('sent')}
          />
          <FolderCard
            icon={<HelpCircle className="w-6 h-6" style={{ color: '#1E1E24' }} strokeWidth={1.5} />}
            label="Unbekannt"
            count={0}
            unread={0}
            onClick={() => onNavigateFolder('unknown')}
          />
        </div>
      </div>
    </div>
  );
}

function FolderCard({ icon, label, count, unread, onClick }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  unread: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg p-5 text-left hover:shadow-md transition-all border border-transparent hover:border-gray-200 group w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform" style={{ backgroundColor: '#EEF4FF', border: '1px solid #DDE7FF' }}>
          {icon}
        </div>
        {unread > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
            {unread}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-dark">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">
        {count} {count === 1 ? 'Nachricht' : 'Nachrichten'}
      </p>
    </button>
  );
}
