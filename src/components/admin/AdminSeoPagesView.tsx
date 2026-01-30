import { useState, useEffect } from "react";
import { Plus, Search, Edit, CheckCircle, XCircle, Lock, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
import AdminSeoPageEdit from "./AdminSeoPageEdit";
import TableActionsDropdown, { ActionItem } from "../common/TableActionsDropdown";

interface SeoPage {
  id: string;
  path: string;
  page_type: string;
  is_public: boolean;
  allow_indexing: boolean;
  title: string | null;
  description: string | null;
  updated_at: string;
}

export default function AdminSeoPagesView() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterIndexing, setFilterIndexing] = useState<string>("all");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("seo_page_settings")
        .select("*")
        .order("path", { ascending: true });

      if (error) throw error;

      setPages(data || []);
    } catch (error) {
      console.error("Error loading SEO pages:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPages = pages.filter((page) => {
    const matchesSearch = page.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || page.page_type === filterType;
    const matchesIndexing =
      filterIndexing === "all" ||
      (filterIndexing === "indexed" && page.allow_indexing && page.is_public) ||
      (filterIndexing === "noindex" && (!page.allow_indexing || !page.is_public));

    return matchesSearch && matchesType && matchesIndexing;
  });

  const getPageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      marketing: "Marketing",
      feature: "Feature",
      blog: "Blog",
      app: "App",
    };
    return labels[type] || type;
  };

  const getPageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      marketing: "bg-blue-100 text-blue-700",
      feature: "bg-violet-100 text-violet-700",
      blog: "bg-emerald-100 text-emerald-700",
      app: "bg-gray-100 text-gray-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (selectedPageId) {
    return (
      <AdminSeoPageEdit
        pageId={selectedPageId}
        onBack={() => {
          setSelectedPageId(null);
          loadPages();
        }}
      />
    );
  }

  if (showAddModal) {
    return (
      <AdminSeoPageEdit
        pageId={null}
        onBack={() => {
          setShowAddModal(false);
          loadPages();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Wichtiger Hinweis:</p>
            <p>
              App-Seiten (Dashboard, Admin, Mieterportal, Login, etc.) sind immer noindex und können
              nicht öffentlich indexiert werden. Nur Marketing-, Feature- und Blog-Seiten können für
              Suchmaschinen freigegeben werden.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Seiten durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Alle Typen</option>
          <option value="marketing">Marketing</option>
          <option value="feature">Feature</option>
          <option value="blog">Blog</option>
          <option value="app">App</option>
        </select>

        <select
          value={filterIndexing}
          onChange={(e) => setFilterIndexing(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Alle</option>
          <option value="indexed">Indexiert</option>
          <option value="noindex">Noindex</option>
        </select>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neue Seite
        </button>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pfad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Indexierung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zuletzt geändert
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktion
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredPages.map((page) => {
                const isIndexable = page.is_public && page.allow_indexing;
                const isAppPage = page.page_type === "app";

                return (
                  <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-dark">{page.path}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPageTypeColor(
                          page.page_type
                        )}`}
                      >
                        {getPageTypeLabel(page.page_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAppPage ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                          <Lock className="w-4 h-4" />
                          Fix Noindex
                        </span>
                      ) : isIndexable ? (
                        <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                          Index
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                          <XCircle className="w-4 h-4" />
                          Noindex
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {page.title ? (
                        <span className="text-sm text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Gesetzt
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Leer</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {page.description ? (
                        <span className="text-sm text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Gesetzt
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Leer</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(page.updated_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center">
                        <TableActionsDropdown
                          actions={[
                            {
                              label: "Bearbeiten",
                              onClick: () => setSelectedPageId(page.id),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPages.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500">Keine Seiten gefunden</p>
        </div>
      )}

      <div className="text-sm text-gray-500 text-center">
        {filteredPages.length} von {pages.length} Seite{pages.length !== 1 ? "n" : ""}
      </div>
    </div>
  );
}
