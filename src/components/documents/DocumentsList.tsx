import { useState, useEffect } from "react";
import { FileText, Filter, Search, Download, Eye, Calendar, Building, User, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import DocumentFeatureGuard from "./DocumentFeatureGuard";

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  upload_date: string;
  file_size: number;
  category: string | null;
  associations?: Association[];
}

interface Association {
  association_type: string;
  association_id: string;
  property_name?: string;
  tenant_name?: string;
}

interface DocumentsListProps {
  onDocumentClick: (documentId: string) => void;
}

export default function DocumentsList({ onDocumentClick }: DocumentsListProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    documentType: "",
    assignmentStatus: "",
    propertyId: "",
    timeRange: "",
    archiveStatus: "active",
  });
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      loadDocuments();
      loadProperties();
    }
  }, [user, filters.archiveStatus]);

  async function loadProperties() {
    try {
      const { data } = await supabase
        .from("properties")
        .select("id, name")
        .order("name");

      if (data) setProperties(data);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  async function loadDocuments() {
    try {
      setLoading(true);

      let query = supabase.from("documents").select("*");

      if (filters.archiveStatus === "active") {
        query = query.eq("is_archived", false);
      } else if (filters.archiveStatus === "archived") {
        query = query.eq("is_archived", true);
      }

      const { data: docs } = await query.order("upload_date", { ascending: false });

      if (docs) {
        const docsWithAssociations = await Promise.all(
          docs.map(async (doc) => {
            const { data: associations } = await supabase
              .from("document_associations")
              .select("association_type, association_id")
              .eq("document_id", doc.id);

            if (associations && associations.length > 0) {
              const enrichedAssociations = await Promise.all(
                associations.map(async (assoc) => {
                  let name = undefined;

                  if (assoc.association_type === "property") {
                    const { data: prop } = await supabase
                      .from("properties")
                      .select("name")
                      .eq("id", assoc.association_id)
                      .maybeSingle();
                    name = prop?.name;
                  } else if (assoc.association_type === "tenant") {
                    const { data: tenant } = await supabase
                      .from("tenants")
                      .select("name")
                      .eq("id", assoc.association_id)
                      .maybeSingle();
                    name = tenant?.name;
                  }

                  return {
                    ...assoc,
                    property_name: assoc.association_type === "property" ? name : undefined,
                    tenant_name: assoc.association_type === "tenant" ? name : undefined,
                  };
                })
              );

              return { ...doc, associations: enrichedAssociations };
            }

            return { ...doc, associations: [] };
          })
        );

        setDocuments(docsWithAssociations);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contract: "Vertrag",
      invoice: "Rechnung",
      bill: "Abrechnung",
      receipt: "Beleg",
      report: "Bericht",
      other: "Sonstiges",
      floor_plan: "Grundriss",
      energy_certificate: "Energieausweis",
      insurance: "Versicherung",
      property_deed: "Grundbuchauszug",
      rental_agreement: "Mietvertrag",
      utility_bill: "Nebenkostenabrechnung",
      maintenance: "Wartung",
      photo: "Foto",
      blueprint: "Bauplan",
      expose: "Exposé",
    };
    return labels[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      contract: "bg-blue-100 text-blue-700",
      invoice: "bg-emerald-100 text-emerald-700",
      bill: "bg-amber-100 text-amber-700",
      receipt: "bg-blue-100 text-blue-700",
      report: "bg-gray-100 text-gray-700",
      other: "bg-gray-100 text-gray-700",
      floor_plan: "bg-blue-100 text-blue-700",
      energy_certificate: "bg-emerald-100 text-emerald-700",
      insurance: "bg-blue-100 text-blue-700",
      property_deed: "bg-amber-100 text-amber-700",
      rental_agreement: "bg-amber-100 text-amber-700",
      utility_bill: "bg-amber-100 text-amber-700",
      maintenance: "bg-slate-100 text-slate-700",
      photo: "bg-red-100 text-red-700",
      blueprint: "bg-blue-100 text-blue-700",
      expose: "bg-blue-100 text-blue-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const getAssociationLabel = (associations: Association[]) => {
    if (!associations || associations.length === 0) {
      return <span className="text-gray-400 italic">Nicht zugeordnet</span>;
    }

    const firstAssoc = associations[0];
    let label = "";

    if (firstAssoc.association_type === "property" && firstAssoc.property_name) {
      label = firstAssoc.property_name;
    } else if (firstAssoc.association_type === "tenant" && firstAssoc.tenant_name) {
      label = firstAssoc.tenant_name;
    } else {
      label = firstAssoc.association_type;
    }

    if (associations.length > 1) {
      label += ` (+${associations.length - 1})`;
    }

    return <span className="text-gray-700">{label}</span>;
  };

  const filteredDocuments = documents.filter((doc) => {
    if (searchQuery && !isPro) {
      return doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    if (searchQuery && isPro) {
      const query = searchQuery.toLowerCase();
      return (
        doc.file_name.toLowerCase().includes(query) ||
        doc.category?.toLowerCase().includes(query) ||
        doc.document_type.toLowerCase().includes(query)
      );
    }

    if (filters.documentType && doc.document_type !== filters.documentType) {
      return false;
    }

    if (filters.assignmentStatus === "assigned" && (!doc.associations || doc.associations.length === 0)) {
      return false;
    }

    if (filters.assignmentStatus === "unassigned" && doc.associations && doc.associations.length > 0) {
      return false;
    }

    if (filters.propertyId && isPro) {
      const hasProperty = doc.associations?.some(
        (a) => a.association_type === "property" && a.association_id === filters.propertyId
      );
      if (!hasProperty) return false;
    }

    if (filters.timeRange && isPro) {
      const uploadDate = new Date(doc.upload_date);
      const now = new Date();
      let cutoffDate = new Date();

      if (filters.timeRange === "7days") {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filters.timeRange === "30days") {
        cutoffDate.setDate(now.getDate() - 30);
      } else if (filters.timeRange === "90days") {
        cutoffDate.setDate(now.getDate() - 90);
      }

      if (uploadDate < cutoffDate) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={isPro ? "Dateiname, Kategorie oder Typ durchsuchen..." : "Dateiname durchsuchen..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {!isPro && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dokumenttyp
              </label>
              <select
                value={filters.documentType}
                onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alle Typen</option>
                <option value="contract">Vertrag</option>
                <option value="invoice">Rechnung</option>
                <option value="bill">Abrechnung</option>
                <option value="receipt">Beleg</option>
                <option value="report">Bericht</option>
                <option value="other">Sonstiges</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zuordnung
              </label>
              <select
                value={filters.assignmentStatus}
                onChange={(e) => setFilters({ ...filters, assignmentStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alle</option>
                <option value="assigned">Zugeordnet</option>
                <option value="unassigned">Nicht zugeordnet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.archiveStatus}
                onChange={(e) => setFilters({ ...filters, archiveStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Aktive Dokumente</option>
                <option value="archived">Archivierte Dokumente</option>
                <option value="">Alle Dokumente</option>
              </select>
            </div>

            <DocumentFeatureGuard
              feature="extended-filters"
              fallback={
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Immobilie
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                    >
                      <option>Alle Immobilien</option>
                    </select>
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              }
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immobilie
                </label>
                <select
                  value={filters.propertyId}
                  onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Alle Immobilien</option>
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
                </select>
              </div>
            </DocumentFeatureGuard>

            <DocumentFeatureGuard
              feature="time-range-filter"
              fallback={
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zeitraum
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                    >
                      <option>Alle Zeiträume</option>
                    </select>
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              }
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zeitraum
                </label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Alle Zeiträume</option>
                  <option value="7days">Letzte 7 Tage</option>
                  <option value="30days">Letzte 30 Tage</option>
                  <option value="90days">Letzte 90 Tage</option>
                </select>
              </div>
            </DocumentFeatureGuard>
          </div>
        )}
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">
            Keine Dokumente gefunden
          </h3>
          <p className="text-gray-500">
            {searchQuery || Object.values(filters).some((v) => v)
              ? "Passen Sie Ihre Filter an oder versuchen Sie eine andere Suche."
              : "Laden Sie Ihr erstes Dokument hoch, um loszulegen."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dokumentname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zugeordnet zu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Größe
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onDocumentClick(doc.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-dark truncate max-w-xs">
                          {doc.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(
                          doc.document_type
                        )}`}
                      >
                        {getDocumentTypeLabel(doc.document_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getAssociationLabel(doc.associations || [])}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(doc.upload_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentClick(doc.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ansehen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 text-center">
        {filteredDocuments.length} von {documents.length} Dokument{documents.length !== 1 ? "en" : ""} angezeigt
      </div>
    </div>
  );
}
