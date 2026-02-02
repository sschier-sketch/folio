import { useState, useEffect } from "react";
import { Plus, Search, FileText, Copy, Trash2, Download, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { operatingCostService, OperatingCostStatement } from "../../lib/operatingCostService";
import { supabase } from "../../lib/supabase";
import Badge from "../common/Badge";
import TableActionsDropdown from "../common/TableActionsDropdown";
import { generateOperatingCostPdf } from "../../lib/operatingCostPdfGenerator";
import { sendOperatingCostPdf } from "../../lib/operatingCostMailer";
import OperatingCostSendView from "./OperatingCostSendView";
import { PremiumUpgradePrompt } from "../PremiumUpgradePrompt";

interface Property {
  id: string;
  name: string;
}

interface PropertyUnit {
  id: string;
  unit_number: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
}

interface StatementWithProperty extends OperatingCostStatement {
  property?: Property;
  unit?: PropertyUnit;
  tenant?: Tenant;
}

export default function OperatingCostsView() {
  const { user } = useAuth();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statements, setStatements] = useState<StatementWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1);

  const sendStatementId = searchParams.get('sendStatement');

  async function loadProperties() {
    const { data } = await supabase
      .from("properties")
      .select("id, name")
      .eq("user_id", user?.id)
      .order("name");

    if (data) setProperties(data);
  }

  async function loadStatements() {
    if (!user) return;

    setLoading(true);
    const { data } = await operatingCostService.listStatements(user.id, {
      year: selectedYear,
    });

    if (data) {
      const statementsWithProperties = await Promise.all(
        data.map(async (statement: any) => {
          const { data: property } = await supabase
            .from("properties")
            .select("id, name")
            .eq("id", statement.property_id)
            .maybeSingle();

          let unit = undefined;
          let tenant = undefined;

          if (statement.unit_id) {
            const { data: unitData } = await supabase
              .from("property_units")
              .select("id, unit_number")
              .eq("id", statement.unit_id)
              .maybeSingle();
            unit = unitData || undefined;

            const { data: contract } = await supabase
              .from("rental_contracts")
              .select("tenant_id")
              .eq("unit_id", statement.unit_id)
              .eq("property_id", statement.property_id)
              .or(`contract_end.is.null,contract_end.gte.${statement.year}-12-31`)
              .lte("contract_start", `${statement.year}-12-31`)
              .maybeSingle();

            if (contract?.tenant_id) {
              const { data: tenantData } = await supabase
                .from("tenants")
                .select("id, first_name, last_name")
                .eq("id", contract.tenant_id)
                .maybeSingle();
              tenant = tenantData || undefined;
            }
          }

          return { ...statement, property: property || undefined, unit, tenant };
        })
      );

      setStatements(statementsWithProperties);
    }

    setLoading(false);
  }

  const filteredStatements = statements.filter((statement) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return statement.property?.name.toLowerCase().includes(query);
  });

  const availableYears = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="gray">Entwurf</Badge>;
      case "ready":
        return <Badge variant="blue">Fertiggestellt</Badge>;
      case "sent":
        return <Badge variant="green">Versendet</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleStatementClick = (statement: StatementWithProperty) => {
    if (statement.status === "draft") {
      navigate(`/abrechnungen/betriebskosten/${statement.id}/kosten`);
    } else {
      navigate(`/abrechnungen/betriebskosten/${statement.id}/versand`);
    }
  };

  const handleDeleteStatement = async (statementId: string) => {
    if (!confirm("Möchten Sie diese Betriebskostenabrechnung wirklich löschen?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("operating_cost_statements")
        .delete()
        .eq("id", statementId);

      if (error) throw error;

      await loadStatements();
    } catch (error) {
      console.error("Error deleting statement:", error);
      alert("Fehler beim Löschen der Abrechnung");
    }
  };

  const handleDuplicateStatement = async (statement: StatementWithProperty) => {
    if (!user) return;

    try {
      const newYear = statement.year + 1;

      const newStatement = {
        user_id: user.id,
        property_id: statement.property_id,
        year: newYear,
        status: "draft",
        total_costs: 0,
        cost_items: statement.cost_items || [],
        distribution_keys: statement.distribution_keys || {},
        tenant_shares: {}
      };

      const { error } = await operatingCostService.createStatement(newStatement);

      if (error) throw error;

      await loadStatements();
      alert(`Abrechnung wurde für das Jahr ${newYear} dupliziert`);
    } catch (error) {
      console.error("Error duplicating statement:", error);
      alert("Fehler beim Duplizieren der Abrechnung");
    }
  };

  const handleDownloadAllPdfs = async (statement: StatementWithProperty) => {
    if (!user) return;

    try {
      console.log('Starting PDF download for statement:', statement.id);

      const { data: results, error: resultsError } = await supabase
        .from('operating_cost_results')
        .select('*')
        .eq('statement_id', statement.id);

      console.log('Results query:', { results, resultsError });

      if (resultsError) {
        console.error('Error loading results:', resultsError);
        alert(`Fehler beim Laden der Ergebnisse: ${resultsError.message}`);
        return;
      }

      if (!results || results.length === 0) {
        alert('Keine Ergebnisse für diese Abrechnung gefunden');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const result of results) {
        console.log('Generating PDF for result:', result.id);

        const { data, error } = await generateOperatingCostPdf(
          user.id,
          statement.id,
          result.id
        );

        console.log('PDF generation result:', { data, error });

        if (error) {
          console.error('Error generating PDF:', error);
          errorCount++;
          continue;
        }

        if (data && data.pdfBlob) {
          console.log('PDF blob received, size:', data.pdfBlob.size);

          const blob = data.pdfBlob;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;

          const { data: tenant } = result.tenant_id ? await supabase
            .from('tenants')
            .select('first_name, last_name')
            .eq('id', result.tenant_id)
            .single() : { data: null };

          const tenantName = tenant
            ? `${tenant.first_name}_${tenant.last_name}`
            : `Mieter_${result.id}`;

          link.download = `Betriebskostenabrechnung_${statement.year}_${tenantName}.pdf`;
          document.body.appendChild(link);
          console.log('Clicking download link for:', link.download);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          successCount++;
        } else {
          console.error('No PDF blob in response');
          errorCount++;
        }
      }

      if (successCount > 0) {
        alert(`${successCount} PDF(s) wurden erfolgreich heruntergeladen${errorCount > 0 ? `, ${errorCount} fehlgeschlagen` : ''}`);
      } else {
        alert('Fehler: Keine PDFs konnten generiert werden');
      }
    } catch (error) {
      console.error("Error downloading PDFs:", error);
      alert(`Fehler beim Herunterladen der PDFs: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  const handleSendAllToTenants = async (statement: StatementWithProperty) => {
    if (!user) return;

    if (!confirm(`Möchten Sie die Betriebskostenabrechnungen an alle Mieter versenden?\n\nDie PDFs werden per E-Mail versendet und im Mieterportal bereitgestellt.`)) {
      return;
    }

    try {
      const { data: results } = await supabase
        .from('operating_cost_results')
        .select('*, tenant:tenants(email)')
        .eq('statement_id', statement.id);

      if (!results || results.length === 0) {
        alert('Keine Ergebnisse für diese Abrechnung gefunden');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const result of results) {
        const tenantEmail = result.tenant?.email;
        if (!tenantEmail) {
          errorCount++;
          continue;
        }

        const { data: existingPdf } = await supabase
          .from('operating_cost_pdfs')
          .select('id')
          .eq('result_id', result.id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let pdfId = existingPdf?.id;

        if (!pdfId) {
          const { data: pdfData, error: pdfError } = await generateOperatingCostPdf(
            user.id,
            statement.id,
            result.id
          );

          if (pdfError || !pdfData) {
            errorCount++;
            continue;
          }

          pdfId = pdfData.pdfId;
        }

        const { error: sendError } = await sendOperatingCostPdf(
          user.id,
          statement.id,
          result.id,
          pdfId,
          tenantEmail
        );

        if (sendError) {
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        await operatingCostService.updateStatementStatus(statement.id, 'sent');
        await loadStatements();
      }

      if (errorCount === 0) {
        alert(`Alle ${successCount} Abrechnungen wurden erfolgreich versendet`);
      } else {
        alert(`${successCount} Abrechnungen versendet, ${errorCount} fehlgeschlagen`);
      }
    } catch (error) {
      console.error("Error sending to tenants:", error);
      alert("Fehler beim Versenden der Abrechnungen");
    }
  };

  const handleBackFromSend = () => {
    setSearchParams({ tab: 'operating-costs' });
  };

  useEffect(() => {
    if (user && isPro) {
      loadProperties();
      loadStatements();
    }
  }, [user, selectedYear, isPro]);

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <PremiumUpgradePrompt
        featureKey="billing_operating_costs"
        title="Betriebskostenabrechnung"
        description="Erstellen Sie professionelle Betriebskostenabrechnungen für Ihre Mieter. Sparen Sie Zeit und vermeiden Sie Fehler mit unserem intelligenten Abrechnungsassistenten."
        features={[
          "Automatische Berechnung nach Verteilerschlüsseln",
          "Rechtssichere Abrechnungen gemäß Betriebskostenverordnung",
          "Import von Rechnungen und Belegen",
          "Automatische Zuordnung zu Kostenpositionen",
          "Export als PDF mit Mieter-Anschreiben",
          "Versand per E-Mail direkt aus der Software"
        ]}
      />
    );
  }

  if (sendStatementId) {
    return <OperatingCostSendView statementId={sendStatementId} onBack={handleBackFromSend} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="text"
              placeholder="Nach Immobilie suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button
            onClick={() => navigate("/abrechnungen/betriebskosten/neu")}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Neue Abrechnung
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-blue rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Lade Abrechnungen...</p>
          </div>
        ) : filteredStatements.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              {searchQuery
                ? "Keine Abrechnungen gefunden"
                : statements.length === 0
                ? "Noch keine Betriebskostenabrechnungen"
                : "Keine Abrechnungen für dieses Jahr"}
            </p>
            {!searchQuery && statements.length === 0 && (
              <button
                onClick={() => navigate("/abrechnungen/betriebskosten/neu")}
                className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
              >
                Erste Abrechnung erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                      Immobilie
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                      Einheit
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                      Mieter
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                      Jahr
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                      Gesamtkosten
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                      Letzte Bearbeitung
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredStatements.map((statement) => (
                    <tr
                      key={statement.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-6 py-4 text-sm font-medium text-dark cursor-pointer"
                        onClick={() => handleStatementClick(statement)}
                      >
                        {statement.property?.name || "Unbekannte Immobilie"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-700 cursor-pointer"
                        onClick={() => handleStatementClick(statement)}
                      >
                        {statement.unit ? `Einheit ${statement.unit.unit_number}` : '-'}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-700 cursor-pointer"
                        onClick={() => handleStatementClick(statement)}
                      >
                        {statement.tenant
                          ? `${statement.tenant.first_name} ${statement.tenant.last_name}`
                          : '-'}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-700 cursor-pointer"
                        onClick={() => handleStatementClick(statement)}
                      >
                        {statement.year}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium text-dark cursor-pointer"
                        onClick={() => handleStatementClick(statement)}
                      >
                        {Number(statement.total_costs).toFixed(2)} €
                      </td>
                      <td
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => handleStatementClick(statement)}
                      >
                        {getStatusBadge(statement.status)}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-700 cursor-pointer"
                        onClick={() => handleStatementClick(statement)}
                      >
                        {statement.updated_at ? formatDateTime(statement.updated_at) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <TableActionsDropdown
                            actions={[
                              ...(statement.status === 'ready' || statement.status === 'sent' ? [
                                {
                                  label: 'PDF herunterladen',
                                  onClick: () => handleDownloadAllPdfs(statement),
                                  icon: <Download className="w-4 h-4" />
                                },
                                {
                                  label: 'An Mieter senden',
                                  onClick: () => setSearchParams({ tab: 'operating-costs', sendStatement: statement.id }),
                                  icon: <Mail className="w-4 h-4" />
                                }
                              ] : []),
                              {
                                label: 'Duplizieren',
                                onClick: () => handleDuplicateStatement(statement),
                                icon: <Copy className="w-4 h-4" />
                              },
                              {
                                label: 'Löschen',
                                onClick: () => handleDeleteStatement(statement.id),
                                icon: <Trash2 className="w-4 h-4" />,
                                variant: 'danger'
                              }
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
