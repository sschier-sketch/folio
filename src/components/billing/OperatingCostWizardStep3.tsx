import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, Mail, AlertCircle, Building2, Download } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { operatingCostService, OperatingCostStatement, OperatingCostResult } from "../../lib/operatingCostService";
import { supabase } from "../../lib/supabase";
import { generateOperatingCostPdf } from "../../lib/operatingCostPdfGenerator";
import { sendOperatingCostPdf, checkIfAnySent } from "../../lib/operatingCostMailer";

interface ResultWithDetails extends OperatingCostResult {
  tenant_name?: string;
  unit_number?: string;
  tenant_email?: string;
  pdf_id?: string;
  is_sent?: boolean;
}

export default function OperatingCostWizardStep3() {
  const { id: statementId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statement, setStatement] = useState<OperatingCostStatement | null>(null);
  const [results, setResults] = useState<ResultWithDetails[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  useEffect(() => {
    if (statementId && user) {
      loadData();
      checkBankDetails();
    }
  }, [statementId, user]);

  async function checkBankDetails() {
    if (!user) return;

    const { data } = await supabase
      .from('user_bank_details')
      .select('id')
      .eq('user_id', user.id)
      .single();

    setHasBankDetails(!!data);
  }

  async function loadData() {
    if (!statementId) return;

    setLoading(true);
    setError(null);

    try {
      const { statement, lineItems, results: existingResults, error } =
        await operatingCostService.getStatementDetail(statementId);

      if (error) throw error;

      if (!statement) {
        throw new Error('Abrechnung nicht gefunden');
      }

      setStatement(statement);

      const { data: propertyData } = await supabase
        .from('properties')
        .select('*')
        .eq('id', statement.property_id)
        .single();

      setProperty(propertyData);

      if (existingResults && existingResults.length > 0) {
        await loadResultsWithDetails(existingResults);
      } else {
        await computeAndLoadResults();
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  async function loadResultsWithDetails(results: OperatingCostResult[]) {
    const resultsWithDetails: ResultWithDetails[] = [];

    for (const result of results) {
      const details: ResultWithDetails = { ...result };

      if (result.tenant_id) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('first_name, last_name, email')
          .eq('id', result.tenant_id)
          .single();

        if (tenant) {
          details.tenant_name = `${tenant.first_name} ${tenant.last_name}`;
          details.tenant_email = tenant.email;
        }
      }

      if (result.unit_id) {
        const { data: unit } = await supabase
          .from('property_units')
          .select('unit_number')
          .eq('id', result.unit_id)
          .single();

        if (unit) {
          details.unit_number = unit.unit_number;
        }
      }

      const { data: existingPdf } = await supabase
        .from('operating_cost_pdfs')
        .select('id')
        .eq('result_id', result.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingPdf) {
        details.pdf_id = existingPdf.id;
      }

      const { data: sentLog } = await supabase
        .from('operating_cost_send_logs')
        .select('id')
        .eq('result_id', result.id)
        .eq('status', 'success')
        .limit(1)
        .single();

      details.is_sent = !!sentLog;

      resultsWithDetails.push(details);
    }

    setResults(resultsWithDetails);
  }

  async function computeAndLoadResults() {
    if (!statementId) return;

    setComputing(true);
    try {
      const { data: computedResults, error: computeError } =
        await operatingCostService.computeResults(statementId);

      if (computeError) throw computeError;

      if (computedResults) {
        await loadResultsWithDetails(computedResults);
      }
    } catch (err: any) {
      console.error('Error computing results:', err);
      setError(err.message || 'Fehler bei der Berechnung');
    } finally {
      setComputing(false);
    }
  }

  async function handleGeneratePdf(result: ResultWithDetails) {
    if (!user || !statementId) return;

    setGeneratingPdfId(result.id);
    setError(null);

    try {
      const { data, error } = await generateOperatingCostPdf(
        user.id,
        statementId,
        result.id
      );

      if (error) throw error;

      if (data) {
        const blob = data.pdfBlob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Betriebskostenabrechnung_${statement?.year}_${result.tenant_name?.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setResults((prev) =>
          prev.map((r) =>
            r.id === result.id ? { ...r, pdf_id: data.pdfId } : r
          )
        );
      }
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Fehler beim Erstellen des PDFs');
    } finally {
      setGeneratingPdfId(null);
    }
  }

  async function handleSendEmail(result: ResultWithDetails) {
    if (!user || !statementId || !result.tenant_email) {
      setError('Keine E-Mail-Adresse hinterlegt');
      return;
    }

    if (!result.pdf_id) {
      setError('Bitte erst PDF generieren');
      return;
    }

    setSendingEmailId(result.id);
    setError(null);

    try {
      const { error } = await sendOperatingCostPdf(
        user.id,
        statementId,
        result.id,
        result.pdf_id,
        result.tenant_email
      );

      if (error) throw error;

      setResults((prev) =>
        prev.map((r) =>
          r.id === result.id ? { ...r, is_sent: true } : r
        )
      );

      const anySent = await checkIfAnySent(statementId);
      if (anySent && statement?.status !== 'sent') {
        await operatingCostService.updateStatementStatus(statementId, 'sent');
        setStatement((prev) => prev ? { ...prev, status: 'sent' } : null);
      }
    } catch (err: any) {
      console.error('Error sending email:', err);
      setError(err.message || 'Fehler beim Versenden der E-Mail');
    } finally {
      setSendingEmailId(null);
    }
  }

  async function handleSaveStatement() {
    if (!statementId) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await operatingCostService.updateStatementStatus(
        statementId,
        'ready'
      );

      if (error) throw error;

      navigate('/dashboard?view=billing');
    } catch (err: any) {
      console.error('Error saving statement:', err);
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    navigate(`/abrechnungen/betriebskosten/${statementId}/kosten`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-blue rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Lade Abrechnung...</p>
        </div>
      </div>
    );
  }

  if (computing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-blue rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Berechne Ergebnisse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">
            Betriebskostenabrechnung {statement?.year}
          </h1>
          <p className="text-gray-400">
            Überprüfen Sie die Ergebnisse und senden Sie die Abrechnungen
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold mb-2">
                ✓
              </div>
              <span className="text-sm font-medium text-green-500">
                Objekt & Jahr
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-green-500 -mt-6" />

            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold mb-2">
                ✓
              </div>
              <span className="text-sm font-medium text-green-500">
                Kosten erfassen
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-primary-blue -mt-6" />

            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-semibold mb-2">
                3
              </div>
              <span className="text-sm font-medium text-primary-blue">
                Versand
              </span>
            </div>
          </div>
        </div>

        {!hasBankDetails && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 mb-1">
                Bankverbindung fehlt
              </h4>
              <p className="text-sm text-yellow-700 mb-2">
                Für Nachzahlungen wird keine Bankverbindung im PDF angezeigt.
              </p>
              <Link
                to="/dashboard?view=settings"
                className="text-sm text-yellow-900 font-medium hover:underline"
              >
                In Mein Account hinterlegen →
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Fehler</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-primary-blue" />
              <div>
                <h3 className="font-semibold text-dark">
                  {property?.name || 'Immobilie'}
                </h3>
                <p className="text-sm text-gray-400">
                  Abrechnungsjahr: {statement?.year}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Gesamtkosten</p>
              <p className="text-2xl font-bold text-primary-blue">
                {(statement?.total_costs || 0).toLocaleString('de-DE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                €
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-dark mb-6">
            Schritt 3: Ergebnisse & Versand
          </h2>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Keine Mieter im Abrechnungszeitraum
              </h3>
              <p className="text-gray-400 mb-6">
                Für diesen Abrechnungszeitraum wurden keine aktiven
                Mietverhältnisse gefunden.
              </p>
              <button
                onClick={handleBack}
                className="text-primary-blue hover:underline"
              >
                Zurück zu Schritt 2
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-dark mb-1">
                        {result.tenant_name || 'Unbekannter Mieter'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Einheit: {result.unit_number || 'N/A'}</span>
                        <span>•</span>
                        <span>
                          {Number(result.area_sqm).toFixed(2)} m²
                        </span>
                        <span>•</span>
                        <span>{result.days_in_period} Tage</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGeneratePdf(result)}
                        disabled={generatingPdfId === result.id}
                        className="p-2 text-primary-blue bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="PDF herunterladen"
                      >
                        {generatingPdfId === result.id ? (
                          <div className="w-5 h-5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSendEmail(result)}
                        disabled={
                          !result.tenant_email ||
                          !result.pdf_id ||
                          sendingEmailId === result.id ||
                          result.is_sent
                        }
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          result.is_sent
                            ? 'text-green-600 bg-green-50'
                            : 'text-primary-blue bg-blue-50 hover:bg-blue-100'
                        }`}
                        title={
                          result.is_sent
                            ? 'Bereits versendet'
                            : !result.tenant_email
                            ? 'Keine E-Mail-Adresse hinterlegt'
                            : !result.pdf_id
                            ? 'Bitte erst PDF generieren'
                            : 'Per E-Mail senden'
                        }
                      >
                        {sendingEmailId === result.id ? (
                          <div className="w-5 h-5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Mail className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">
                        Kostenanteil
                      </p>
                      <p className="text-xl font-semibold text-dark">
                        {Number(result.cost_share).toLocaleString('de-DE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        €
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">
                        Vorauszahlungen
                      </p>
                      <p className="text-xl font-semibold text-dark">
                        {Number(result.prepayments).toLocaleString('de-DE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        €
                      </p>
                    </div>

                    <div
                      className={`rounded-lg p-4 ${
                        Number(result.balance) >= 0
                          ? 'bg-red-50'
                          : 'bg-green-50'
                      }`}
                    >
                      <p className="text-sm text-gray-400 mb-1">
                        {Number(result.balance) >= 0
                          ? 'Nachzahlung'
                          : 'Guthaben'}
                      </p>
                      <p
                        className={`text-xl font-semibold ${
                          Number(result.balance) >= 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {Math.abs(Number(result.balance)).toLocaleString(
                          'de-DE',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}{' '}
                        €
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            disabled={saving}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>

          <button
            onClick={handleSaveStatement}
            disabled={saving || results.length === 0}
            className="px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Speichert...
              </span>
            ) : (
              'Abrechnung speichern'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
