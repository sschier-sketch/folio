import { Inbox, Send, HelpCircle } from 'lucide-react';
import type { Folder } from './types';

interface FolderItem {
  id: Folder;
  label: string;
  icon: typeof Inbox;
  count?: number;
}

interface FolderListProps {
  activeFolder: Folder;
  onSelect: (folder: Folder) => void;
  counts: Record<Folder, number>;
  unreadCounts: Record<Folder, number>;
}

export default function FolderList({ activeFolder, onSelect, counts, unreadCounts }: FolderListProps) {
  const folders: FolderItem[] = [
    { id: 'inbox', label: 'Eingang', icon: Inbox },
    { id: 'sent', label: 'Gesendet', icon: Send },
    { id: 'unknown', label: 'Unbekannt', icon: HelpCircle },
  ];

  return (
    <div className="space-y-1">
      {folders.map((folder) => {
        const isActive = activeFolder === folder.id;
        const unread = unreadCounts[folder.id] || 0;
        const total = counts[folder.id] || 0;

        if (folder.id === 'unknown' && total === 0) return null;

        return (
          <button
            key={folder.id}
            onClick={() => onSelect(folder.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <folder.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{folder.label}</span>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                {unread}
              </span>
            )}
            {unread === 0 && total > 0 && (
              <span className="text-xs text-gray-400">{total}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
