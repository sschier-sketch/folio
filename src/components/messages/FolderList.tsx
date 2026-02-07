import { Inbox, Send, HelpCircle, FileText, Settings, Trash2 } from 'lucide-react';
import type { Folder } from './types';

export type SidebarView = Folder | 'templates' | 'settings';

interface FolderItem {
  id: SidebarView;
  label: string;
  icon: typeof Inbox;
}

interface FolderListProps {
  activeFolder: Folder;
  activeView: SidebarView;
  onSelect: (folder: Folder) => void;
  onViewChange: (view: SidebarView) => void;
  counts: Record<Folder, number>;
  unreadCounts: Record<Folder, number>;
}

export default function FolderList({ activeFolder, activeView, onSelect, onViewChange, counts, unreadCounts }: FolderListProps) {
  const folders: FolderItem[] = [
    { id: 'inbox', label: 'Eingang', icon: Inbox },
    { id: 'sent', label: 'Gesendet', icon: Send },
    { id: 'unknown', label: 'Unbekannt', icon: HelpCircle },
    { id: 'trash', label: 'Papierkorb', icon: Trash2 },
  ];

  const extras: FolderItem[] = [
    { id: 'templates', label: 'Vorlagen', icon: FileText },
  ];

  function isFolder(id: SidebarView): id is Folder {
    return id === 'inbox' || id === 'sent' || id === 'unknown' || id === 'trash';
  }

  function handleClick(id: SidebarView) {
    if (isFolder(id)) {
      onSelect(id);
      onViewChange(id);
    } else {
      onViewChange(id);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-1 flex-1">
        {folders.map((folder) => {
          const isActive = activeView === folder.id;
          const folderId = folder.id as Folder;
          const unread = isFolder(folder.id) ? (unreadCounts[folderId] || 0) : 0;
          const total = isFolder(folder.id) ? (counts[folderId] || 0) : 0;

          return (
            <button
              key={folder.id}
              onClick={() => handleClick(folder.id)}
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

        <div className="my-2 border-t border-gray-100" />

        {extras.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-2 border-t border-gray-100 mt-2">
        <button
          onClick={() => handleClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'settings'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Einstellungen</span>
        </button>
      </div>
    </div>
  );
}
