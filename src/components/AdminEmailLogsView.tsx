import { useState, useEffect } from 'react';
import { Mail, Filter, Search, CheckCircle, XCircle, Clock, Ban, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Badge from './common/Badge';

interface EmailLog {
  id: string;
  mail_type: string;
  category: string;
  to_email: string;
  user_id: string | null;
  subject: string;
  provider: string;
  provider_message_id: string | null;
  status: 'queued' | 'sent' | 'failed' | 'skipped';
  error_code: string | null;
  error_message: string | null;
  idempotency_key: string | null;
  metadata: any;
  created_at: string;
  sent_at: string | null;
}

interface Filters {
  status: string;
  category: string;
  mailType: string;
  searchTerm: string;
}

export default function AdminEmailLogsView() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    category: 'all',
    mailType: 'all',
    searchTerm: '',
  });
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    loadLogs();
  }, [filters, page]);

  async function loadLogs() {
    setLoading(true);
    try {
      let query = supabase
        .from('email_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.mailType !== 'all') {
        query = query.eq('mail_type', filters.mailType);
      }

      if (filters.searchTerm) {
        query = query.or(`to_email.ilike.%${filters.searchTerm}%,subject.ilike.%${filters.searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'skipped':
        return <Ban className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
      sent: 'success',
      failed: 'error',
      queued: 'warning',
      skipped: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  }

  function getCategoryBadge(category: string) {
    return (
      <Badge variant={category === 'transactional' ? 'default' : 'warning'}>
        {category}
      </Badge>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">E-Mail Logs</h1>
          <p className="text-gray-400">
            Alle ausgehenden E-Mails nachverfolgen und debuggen
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Aktualisieren
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            >
              <option value="all">Alle</option>
              <option value="sent">Gesendet</option>
              <option value="failed">Fehlgeschlagen</option>
              <option value="queued">Warteschlange</option>
              <option value="skipped">Übersprungen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategorie
            </label>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            >
              <option value="all">Alle</option>
              <option value="transactional">Transaktional</option>
              <option value="informational">Informativ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mail-Typ
            </label>
            <select
              value={filters.mailType}
              onChange={(e) => {
                setFilters({ ...filters, mailType: e.target.value });
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            >
              <option value="all">Alle</option>
              <option value="welcome">Welcome</option>
              <option value="trial_ending">Trial Ending</option>
              <option value="trial_ended">Trial Ended</option>
              <option value="tenant_portal_activation">Tenant Activation</option>
              <option value="referral_invitation">Referral Invitation</option>
              <option value="ticket_reply">Ticket Reply</option>
              <option value="loan_reminder">Loan Reminder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suche
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => {
                  setFilters({ ...filters, searchTerm: e.target.value });
                  setPage(0);
                }}
                placeholder="E-Mail oder Betreff..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Gesendet</p>
              <p className="text-xl font-bold text-dark">{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Keine E-Mail Logs gefunden</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empfänger
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Betreff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          {getStatusBadge(log.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {log.to_email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.mail_type}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(log.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="text-primary-blue hover:text-primary-blue/80"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Zeige {page * pageSize + 1} bis {Math.min((page + 1) * pageSize, totalCount)} von {totalCount} Einträgen
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-dark">E-Mail Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Kategorie</label>
                  <div className="mt-1">{getCategoryBadge(selectedLog.category)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Empfänger</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLog.to_email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Betreff</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLog.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Mail-Typ</label>
                  <p className="mt-1 text-sm">
                    <code className="bg-gray-100 px-2 py-1 rounded">{selectedLog.mail_type}</code>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Provider</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.provider}</p>
                </div>
              </div>

              {selectedLog.provider_message_id && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Provider Message ID</label>
                  <p className="mt-1 text-sm font-mono text-gray-900">{selectedLog.provider_message_id}</p>
                </div>
              )}

              {selectedLog.idempotency_key && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Idempotency Key</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 break-all">{selectedLog.idempotency_key}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Erstellt am</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedLog.created_at).toLocaleString('de-DE')}
                  </p>
                </div>
                {selectedLog.sent_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gesendet am</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedLog.sent_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                )}
              </div>

              {(selectedLog.error_code || selectedLog.error_message) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="text-sm font-medium text-red-800">Fehler</label>
                  {selectedLog.error_code && (
                    <p className="mt-1 text-sm text-red-700">Code: {selectedLog.error_code}</p>
                  )}
                  {selectedLog.error_message && (
                    <p className="mt-1 text-sm text-red-700">{selectedLog.error_message}</p>
                  )}
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Metadata</label>
                  <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
