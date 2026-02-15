import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, FileText, Info } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { operatingCostService, OperatingCostTemplate } from "../../lib/operatingCostService";
import { Button } from "../ui/Button";

interface Property {
  id: string;
  name: string;
  address: string;
}

interface PropertyUnit {
  id: string;
  unit_number: string;
  floor: string | null;
}

export default function OperatingCostWizardStep1() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear() - 1
  );

  const [template, setTemplate] = useState<OperatingCostTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [useTemplate, setUseTemplate] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPropertyId) {
      loadUnits(selectedPropertyId);
    } else {
      setUnits([]);
      setSelectedUnitId("");
      setTemplate(null);
      setUseTemplate(null);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (user && selectedPropertyId) {
      checkTemplate();
    }
  }, [selectedPropertyId, selectedUnitId]);

  async function loadProperties() {
    setLoading(true);
    const { data } = await supabase
      .from("properties")
      .select("id, name, address")
      .eq("user_id", user?.id)
      .order("name");

    if (data) {
      setProperties(data);
    }
    setLoading(false);
  }

  async function loadUnits(propertyId: string) {
    setLoadingUnits(true);
    const { data } = await supabase
      .from("property_units")
      .select("id, unit_number, floor")
      .eq("property_id", propertyId)
      .order("unit_number");

    if (data) {
      setUnits(data);
      if (data.length === 1) {
        setSelectedUnitId(data[0].id);
      } else {
        setSelectedUnitId("");
      }
    }
    setLoadingUnits(false);
  }

  async function checkTemplate() {
    if (!user || !selectedPropertyId) return;

    const unitIdToCheck = selectedUnitId || null;
    setLoadingTemplate(true);
    setTemplate(null);
    setUseTemplate(null);

    const { data } = await operatingCostService.getTemplate(
      user.id,
      selectedPropertyId,
      unitIdToCheck
    );

    if (data && data.operating_cost_template_items && data.operating_cost_template_items.length > 0) {
      setTemplate(data);
    }
    setLoadingTemplate(false);
  }

  const availableYears = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 1 - i
  );

  const hasUnits = units.length > 0;
  const canProceed = selectedPropertyId && selectedYear && (!hasUnits || selectedUnitId);
  const needsTemplateChoice = template && useTemplate === null;

  const deadlineYear = selectedYear + 1;

  async function handleNext() {
    if (!user || !canProceed) return;
    if (needsTemplateChoice) return;

    setCreating(true);
    setError(null);

    try {
      const { data, error } = await operatingCostService.createStatement(
        user.id,
        {
          property_id: selectedPropertyId,
          year: selectedYear,
          unit_id: selectedUnitId || null,
        }
      );

      if (error) throw error;

      if (data) {
        if (useTemplate && template) {
          await applyTemplateToStatement(data.id, template);
        }
        navigate(`/abrechnungen/betriebskosten/${data.id}/kosten`);
      }
    } catch (err: any) {
      console.error("Error creating statement:", err);
      setError(
        err.message || "Fehler beim Erstellen der Abrechnung. Bitte versuchen Sie es erneut."
      );
    } finally {
      setCreating(false);
    }
  }

  async function applyTemplateToStatement(statementId: string, tpl: OperatingCostTemplate) {
    await operatingCostService.saveAllocationParams(statementId, {
      alloc_unit_area: tpl.alloc_unit_area,
      alloc_total_area: tpl.alloc_total_area,
      alloc_unit_persons: tpl.alloc_unit_persons,
      alloc_total_persons: tpl.alloc_total_persons,
      alloc_total_units: tpl.alloc_total_units,
      alloc_unit_mea: tpl.alloc_unit_mea,
      alloc_total_mea: tpl.alloc_total_mea,
    });

    const items = tpl.operating_cost_template_items.map(item => ({
      cost_type: item.cost_type,
      allocation_key: item.allocation_key as any,
      amount: 0,
      is_section_35a: item.is_section_35a || false,
      section_35a_category: (item.section_35a_category as any) || null,
      group_label: item.group_label || null,
    }));

    if (items.length > 0) {
      await operatingCostService.upsertLineItems({
        statement_id: statementId,
        items,
      });
    }
  }

  const templateItemCount = template?.operating_cost_template_items?.length || 0;
  const templateDate = template?.updated_at
    ? new Date(template.updated_at).toLocaleDateString("de-DE")
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">
            Neue Betriebskostenabrechnung
          </h1>
          <p className="text-gray-400">
            Erstellen Sie eine neue Abrechnung in 3 Schritten
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-semibold mb-2">
                1
              </div>
              <span className="text-sm font-medium text-primary-blue">
                Objekt & Jahr
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 -mt-6" />
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-semibold mb-2">
                2
              </div>
              <span className="text-sm text-gray-400">Kosten erfassen</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 -mt-6" />
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-semibold mb-2">
                3
              </div>
              <span className="text-sm text-gray-400">Probeabrechnung & Versand</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-dark mb-6">
            Schritt 1: Immobilie und Abrechnungsjahr wählen
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-blue rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Lade Immobilien...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-1">Fehler</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immobilie <span className="text-red-500">*</span>
                </label>
                {properties.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      Sie haben noch keine Immobilien angelegt. Bitte erstellen
                      Sie zuerst eine Immobilie.
                    </p>
                    <Button
                      onClick={() => navigate("/dashboard?view=properties")}
                      variant="primary"
                    >
                      Zur Immobilienverwaltung
                    </Button>
                  </div>
                ) : (
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="">Immobilie auswählen...</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                        {property.address && ` - ${property.address}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedPropertyId && loadingUnits && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Einheit
                  </label>
                  <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-blue rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500">Lade Einheiten...</span>
                  </div>
                </div>
              )}

              {selectedPropertyId && !loadingUnits && hasUnits && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Einheit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="">Einheit auswählen...</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Einheit {unit.unit_number}
                        {unit.floor && ` (${unit.floor}. OG)`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Bitte wählen Sie die Einheit aus, für die Sie die Betriebskostenabrechnung erstellen möchten. Mieterdaten und Wohnfläche werden aus der gewählten Einheit übernommen.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abrechnungsjahr <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {selectedYear && (
                <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Hinweis zur Abrechnungsfrist</p>
                  <p className="text-sm text-blue-900">
                    Die Betriebskostenabrechnung für das Jahr {selectedYear}{" "}
                    muss bis zum <strong>31.12.{deadlineYear}</strong>{" "}
                    erstellt und versendet werden.
                  </p>
                </div>
              )}

              {canProceed && !loadingTemplate && template && (
                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-5 py-4 flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-blue-900">
                          Vorlage vorhanden
                        </h4>
                        <div className="group relative">
                          <Info className="w-4 h-4 text-blue-400 cursor-help" />
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                            Hierdurch werden die vorgenommenen Einstellungen im nächsten Schritt als Voreinstellung für diese Immobilie oder Einheit gespeichert und bei der Erstellung der nächsten Abrechnung auf Wunsch automatisch angewendet.
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-blue-800">
                        Für diese Immobilie/Einheit existiert eine gespeicherte Vorlage mit {templateItemCount} Kostenarten
                        {templateDate && <> (zuletzt aktualisiert am {templateDate})</>}. Möchten Sie diese Vorlage verwenden?
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => setUseTemplate(true)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            useTemplate === true
                              ? "bg-primary-blue text-white shadow-sm"
                              : "bg-white text-gray-700 border border-gray-200 hover:border-primary-blue hover:text-primary-blue"
                          }`}
                        >
                          Vorlage verwenden
                        </button>
                        <button
                          onClick={() => setUseTemplate(false)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            useTemplate === false
                              ? "bg-gray-700 text-white shadow-sm"
                              : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          Ohne Vorlage starten
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {canProceed && loadingTemplate && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-blue rounded-full animate-spin"></div>
                  Prüfe auf vorhandene Vorlagen...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button
            onClick={() => navigate("/dashboard?view=billing&tab=operating-costs")}
            variant="secondary"
            disabled={creating}
          >
            Zurück
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || creating || properties.length === 0 || (!!template && useTemplate === null)}
            variant="primary"
          >
            {creating ? 'Erstelle...' : 'Weiter'}
          </Button>
        </div>
      </div>
    </div>
  );
}
