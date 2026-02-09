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
  FileText,
} from 'lucide-react';
import type { Folder } from './types';

interface MessagesOverviewProps {
  email: string;
  unreadCount: number;
  sentCount: number;
  totalCount: number;
  onCompose: () => void;
  onNavigateFolder: (folder: Folder) => void;
  onNavigateTemplates: () => void;
}

export default function MessagesOverview({
  email,
  unreadCount,
  sentCount,
  totalCount,
  onCompose,
  onNavigateFolder,
  onNavigateTemplates,
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
                koennen dort zugeordnet werden. So bleiben Ihre Konversationen uebersichtlich und Spam-frei.
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
        <h3 className="text-lg font-semibold text-dark mb-1">E-Mail-Adresse</h3>
        <div className="flex items-center gap-2 mt-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">{email || 'Noch nicht eingerichtet'}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <h3 className="text-lg font-semibold text-dark px-6 pt-6 pb-4">Postfaecher</h3>
        <table className="w-full">
          <thead>
            <tr className="border-t border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Ordner</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Gesamt</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Ungelesen</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <FolderRow
              icon={<Inbox className="w-4 h-4" />}
              label="Posteingang"
              total={totalCount - sentCount}
              unread={unreadCount}
              onClick={() => onNavigateFolder('inbox')}
            />
            <FolderRow
              icon={<Send className="w-4 h-4" />}
              label="Gesendet"
              total={sentCount}
              unread={0}
              onClick={() => onNavigateFolder('sent')}
            />
            <FolderRow
              icon={<HelpCircle className="w-4 h-4" />}
              label="Unbekannt"
              total={0}
              unread={0}
              onClick={() => onNavigateFolder('unknown')}
            />
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold text-dark">Schnellaktionen</h3>
        </div>
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={onCompose}
            className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: '#EEF4FF', borderColor: '#DDE7FF' }}>
              <Send className="w-5 h-5" style={{ color: '#1e1e24' }} />
            </div>
            <div>
              <div className="font-medium text-dark">Neue Nachricht verfassen</div>
              <div className="text-sm text-gray-500">E-Mail an Mieter oder Kontakt senden</div>
            </div>
          </button>

          <button
            onClick={onNavigateTemplates}
            className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: '#EEF4FF', borderColor: '#DDE7FF' }}>
              <FileText className="w-5 h-5" style={{ color: '#1e1e24' }} />
            </div>
            <div>
              <div className="font-medium text-dark">Vorlagen verwalten</div>
              <div className="text-sm text-gray-500">Textbausteine erstellen und bearbeiten</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function FolderRow({ icon, label, total, unread, onClick }: {
  icon: React.ReactNode;
  label: string;
  total: number;
  unread: number;
  onClick: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-gray-400">{icon}</span>
          <span className="text-sm font-medium text-dark">{label}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="text-sm text-gray-500">{total}</span>
      </td>
      <td className="px-6 py-4 text-right">
        {unread > 0 ? (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
            {unread}
          </span>
        ) : (
          <span className="text-sm text-gray-400">0</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <span className="text-xs text-gray-400">Oeffnen &rarr;</span>
      </td>
    </tr>
  );
}
