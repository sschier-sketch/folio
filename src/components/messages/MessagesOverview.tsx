import { useState } from 'react';
import {
  Mail,
  MailOpen,
  Clock,
  FileText,
  Send,
  Inbox,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
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
    <div className="max-w-3xl mx-auto py-2">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">{email}</span>
        <button className="p-0.5 hover:bg-gray-100 rounded-full transition-colors" title="Info">
          <Info className="w-3.5 h-3.5 text-gray-300" />
        </button>
      </div>

      {showSpamNotice && (
        <div className="mb-4 flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Spam-Schutz aktiv</p>
            <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">
              E-Mails von unbekannten Absendern werden im "Unbekannt" Posteingang gesammelt und
              koennen dort zugeordnet werden. So bleiben deine Konversationen uebersichtlich und Spam-frei.
            </p>
          </div>
          <button
            onClick={() => setShowSpamNotice(false)}
            className="p-1 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-amber-500" />
          </button>
        </div>
      )}

      {unreadCount === 0 ? (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-8">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span className="text-sm font-medium text-emerald-700">
            Alles erledigt. Keine offenen Nachrichten.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-blue-50 border border-blue-200 rounded-xl mb-8">
          <MailOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-700">
            {unreadCount} ungelesene {unreadCount === 1 ? 'Nachricht' : 'Nachrichten'} warten auf dich.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          label="UNGELESEN"
          value={unreadCount}
          icon={<MailOpen className="w-5 h-5 text-gray-400" />}
          onClick={() => onNavigateFolder('inbox')}
        />
        <StatCard
          label="UNTERWEGS"
          value={sentCount}
          icon={<Clock className="w-5 h-5 text-gray-400" />}
          onClick={() => onNavigateFolder('sent')}
        />
        <StatCard
          label="GESAMT"
          value={totalCount}
          icon={<FileText className="w-5 h-5 text-gray-400" />}
          onClick={() => onNavigateFolder('inbox')}
        />
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Schnellzugriff
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          icon={<Send className="w-6 h-6 text-gray-500" />}
          title="Neue Nachricht"
          subtitle="E-Mail oder Brief versenden"
          onClick={onCompose}
        />
        <QuickAction
          icon={<Inbox className="w-6 h-6 text-gray-500" />}
          title="Posteingang"
          subtitle="Alle Nachrichten anzeigen"
          onClick={() => onNavigateFolder('inbox')}
        />
        <QuickAction
          icon={<LayoutGrid className="w-6 h-6 text-gray-500" />}
          title="Vorlagen"
          subtitle="Textbausteine verwalten"
          onClick={onNavigateTemplates}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, onClick }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
    </button>
  );
}

function QuickAction({ icon, title, subtitle, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-3 p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}
