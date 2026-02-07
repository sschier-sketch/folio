import { useState, useEffect, useCallback } from 'react';
import { Plus, Mail, RefreshCw, LayoutDashboard, Inbox, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import FolderList from './FolderList';
import type { SidebarView } from './FolderList';
import ThreadList from './ThreadList';
import ThreadDetail from './ThreadDetail';
import ComposeInline from './ComposeInline';
import MessagesOverview from './MessagesOverview';
import MessagesSettings from './MessagesSettings';
import MailTemplatesList from './MailTemplatesList';
import MailTemplateEditor from './MailTemplateEditor';
import ScrollableTabNav from '../common/ScrollableTabNav';
import type { MailThread, UserMailbox, Folder } from './types';

type MessagesTab = 'overview' | 'inbox';

interface MailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function MessagesView() {
  const { user } = useAuth();
  const [mailbox, setMailbox] = useState<UserMailbox | null>(null);
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [activeTab, setActiveTab] = useState<MessagesTab>('overview');
  const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
  const [activeView, setActiveView] = useState<SidebarView>('inbox');
  const [selectedThread, setSelectedThread] = useState<MailThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [folderCounts, setFolderCounts] = useState<Record<Folder, number>>({ inbox: 0, sent: 0, unknown: 0, trash: 0 });
  const [unreadCounts, setUnreadCounts] = useState<Record<Folder, number>>({ inbox: 0, sent: 0, unknown: 0, trash: 0 });
  const [editingTemplate, setEditingTemplate] = useState<MailTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateListKey, setTemplateListKey] = useState(0);

  const loadMailbox = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_mailboxes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setMailbox(data);
  }, [user]);

  const loadThreads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('mail_threads')
      .select('*, tenants(first_name, last_name, email)')
      .eq('user_id', user.id)
      .eq('folder', activeFolder)
      .order('last_message_at', { ascending: false });
    setThreads((data as MailThread[]) || []);
    setLoading(false);
  }, [user, activeFolder]);

  const loadCounts = useCallback(async () => {
    if (!user) return;
    const folders: Folder[] = ['inbox', 'sent', 'unknown', 'trash'];
    const counts: Record<Folder, number> = { inbox: 0, sent: 0, unknown: 0, trash: 0 };
    const unreads: Record<Folder, number> = { inbox: 0, sent: 0, unknown: 0, trash: 0 };
    for (const folder of folders) {
      const { count: total } = await supabase
        .from('mail_threads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('folder', folder);
      counts[folder] = total || 0;
      const { count: unread } = await supabase
        .from('mail_threads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('folder', folder)
        .eq('status', 'unread');
      unreads[folder] = unread || 0;
    }
    setFolderCounts(counts);
    setUnreadCounts(unreads);
  }, [user]);

  useEffect(() => { loadMailbox(); }, [loadMailbox]);
  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  function handleFolderChange(folder: Folder) {
    setActiveFolder(folder);
    setSelectedThread(null);
    setShowCompose(false);
  }

  function handleViewChange(view: SidebarView) {
    setActiveView(view);
    setSelectedThread(null);
    setShowCompose(false);
    setShowTemplateEditor(false);
    setEditingTemplate(null);
  }

  function handleThreadSelect(thread: MailThread) {
    setSelectedThread(thread);
    setShowCompose(false);
  }

  async function handleTrashThread(threadId: string) {
    if (!user) return;
    await supabase
      .from('mail_threads')
      .update({ folder: 'trash', updated_at: new Date().toISOString() })
      .eq('id', threadId)
      .eq('user_id', user.id);
    setSelectedThread(null);
    loadThreads();
    loadCounts();
  }

  async function handleRestoreThread(threadId: string) {
    if (!user) return;
    await supabase
      .from('mail_threads')
      .update({ folder: 'inbox', updated_at: new Date().toISOString() })
      .eq('id', threadId)
      .eq('user_id', user.id);
    setSelectedThread(null);
    loadThreads();
    loadCounts();
  }

  async function handleEmptyTrash() {
    if (!user) return;
    const confirmed = window.confirm('Papierkorb endgueltig leeren? Alle Nachrichten darin werden unwiderruflich geloescht.');
    if (!confirmed) return;
    await supabase
      .from('mail_threads')
      .delete()
      .eq('user_id', user.id)
      .eq('folder', 'trash');
    setSelectedThread(null);
    loadThreads();
    loadCounts();
  }

  function handleRefresh() {
    loadThreads();
    loadCounts();
  }

  function handleNavigateToFolder(folder: Folder) {
    setActiveFolder(folder);
    setActiveView(folder);
    setSelectedThread(null);
    setShowCompose(false);
    setActiveTab('inbox');
  }

  function handleStartCompose() {
    setShowCompose(true);
    setSelectedThread(null);
    if (activeView === 'templates' || activeView === 'settings') {
      setActiveView('inbox');
      setActiveFolder('inbox');
    }
    setActiveTab('inbox');
  }

  function handleComposeSent() {
    setShowCompose(false);
    handleRefresh();
  }

  function handleNavigateTemplates() {
    setActiveView('templates');
    setActiveTab('inbox');
    setShowCompose(false);
  }

  const totalUnread = unreadCounts.inbox + unreadCounts.sent + unreadCounts.unknown;
  const totalMessages = folderCounts.inbox + folderCounts.sent + folderCounts.unknown;

  const isFolderView = activeView === 'inbox' || activeView === 'sent' || activeView === 'unknown' || activeView === 'trash';

  function renderMainContent() {
    if (activeView === 'templates') {
      if (showTemplateEditor) {
        return (
          <MailTemplateEditor
            template={editingTemplate}
            onBack={() => {
              setShowTemplateEditor(false);
              setEditingTemplate(null);
              setTemplateListKey((k) => k + 1);
            }}
            onSaved={() => {
              setShowTemplateEditor(false);
              setEditingTemplate(null);
              setTemplateListKey((k) => k + 1);
            }}
          />
        );
      }
      return (
        <MailTemplatesList
          key={templateListKey}
          onEdit={(t) => {
            setEditingTemplate(t as MailTemplate);
            setShowTemplateEditor(true);
          }}
          onCreate={() => {
            setEditingTemplate(null);
            setShowTemplateEditor(true);
          }}
        />
      );
    }

    return (
      <>
        <div className={`w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto ${selectedThread ? 'hidden lg:block' : 'flex-1 lg:flex-none lg:w-80'}`}>
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 md:hidden">
            <div className="flex gap-1">
              {(['inbox', 'sent', 'unknown', 'trash'] as Folder[]).map((f) => {
                const labels: Record<Folder, string> = { inbox: 'Eingang', sent: 'Gesendet', unknown: 'Unbekannt', trash: 'Papierkorb' };
                return (
                  <button
                    key={f}
                    onClick={() => handleFolderChange(f)}
                    className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-colors ${
                      activeFolder === f ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {labels[f]}
                    {unreadCounts[f] > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-semibold rounded-full bg-blue-600 text-white">
                        {unreadCounts[f]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThread?.id || null}
            onSelect={handleThreadSelect}
            loading={loading}
          />
        </div>

        <div className={`flex-1 min-w-0 ${!selectedThread ? 'hidden lg:flex' : 'flex'} flex-col`}>
          {selectedThread ? (
            <ThreadDetail
              thread={selectedThread}
              userAlias={mailbox?.alias_localpart || ''}
              onBack={() => setSelectedThread(null)}
              onMessageSent={handleRefresh}
              onTrash={() => handleTrashThread(selectedThread.id)}
              onRestore={activeFolder === 'trash' ? () => handleRestoreThread(selectedThread.id) : undefined}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Keine Nachricht ausgewaehlt</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Waehlen Sie eine Konversation aus der Liste oder starten Sie eine neue Nachricht.
              </p>
              <button
                onClick={handleStartCompose}
                className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Neue Nachricht
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nachrichten</h1>
          {mailbox && activeTab === 'inbox' && (
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">{mailbox.alias_localpart}@rentab.ly</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'inbox' && isFolderView && !showCompose && (
            <button
              onClick={handleRefresh}
              className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {activeTab === 'inbox' && activeFolder === 'trash' && folderCounts.trash > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="flex items-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 text-sm font-medium rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Papierkorb leeren
            </button>
          )}
          <button
            onClick={handleStartCompose}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Neue Nachricht
          </button>
        </div>
      </div>

      <div className="bg-white rounded-t-xl border-b border-gray-200">
        <ScrollableTabNav>
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === 'overview' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Übersicht
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
            <button
              onClick={() => { setActiveTab('inbox'); if (!isFolderView) { setActiveView('inbox'); setActiveFolder('inbox'); } }}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === 'inbox' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              Nachrichten
              {totalUnread > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-blue-600 text-white">
                  {totalUnread}
                </span>
              )}
              {activeTab === 'inbox' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
          </div>
        </ScrollableTabNav>
      </div>

      {activeTab === 'overview' && (
        <MessagesOverview
          email={mailbox ? `${mailbox.alias_localpart}@rentab.ly` : ''}
          unreadCount={totalUnread}
          sentCount={folderCounts.sent}
          totalCount={totalMessages}
          onCompose={handleStartCompose}
          onNavigateFolder={handleNavigateToFolder}
          onNavigateTemplates={handleNavigateTemplates}
        />
      )}

      {activeTab === 'inbox' && showCompose && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ComposeInline
            userAlias={mailbox?.alias_localpart || ''}
            onSent={handleComposeSent}
            onCancel={() => setShowCompose(false)}
          />
        </div>
      )}

      {activeTab === 'inbox' && !showCompose && activeView === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
            <button
              onClick={() => { setActiveView('inbox'); setActiveFolder('inbox'); }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-base font-semibold text-gray-900">Nachrichten-Einstellungen</h2>
          </div>
          <MessagesSettings
            currentAlias={mailbox?.alias_localpart || ''}
            onAliasUpdated={(newAlias) => {
              setMailbox((prev) => prev ? { ...prev, alias_localpart: newAlias } : prev);
            }}
          />
        </div>
      )}

      {activeTab === 'inbox' && !showCompose && activeView !== 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 310px)', minHeight: '500px' }}>
          <div className="flex h-full">
            <div className="w-48 flex-shrink-0 border-r border-gray-200 p-3 hidden md:flex flex-col">
              <FolderList
                activeFolder={activeFolder}
                activeView={activeView}
                onSelect={handleFolderChange}
                onViewChange={handleViewChange}
                counts={folderCounts}
                unreadCounts={unreadCounts}
              />
            </div>

            {renderMainContent()}
          </div>
        </div>
      )}

    </div>
  );
}
