import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Plus, X, Info } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { operatingCostService } from "../../lib/operatingCostService";
import { Button } from "../ui/Button";

interface CostItem {
  id?: string;
  cost_type: string;
  allocation_key: "area" | "persons" | "units" | "consumption" | "mea";
  amount: number;
  is_section_35a?: boolean;
  section_35a_category?: "haushaltsnahe_dienstleistungen" | "handwerkerleistungen" | null;
}

const COST_TYPES = [
  "Grundsteuer",
  "Wasserversorgung (kalt)",
  "Entwässerung/Abwasser",
  "Aufzug",
  "Straßenreinigung",
  "Müllbeseitigung",
  "Gebäudereinigung",
  "Ungezieferbekämpfung",
  "Gartenpflege",
  "Beleuchtung (Allgemeinstrom)",
  "Schornsteinreinigung",
  "Gebäudeversicherung",
  "Sach-/Haftpflichtversicherung",
  "Hauswart",
  "Kabelanschluss/Antenne",
  "Waschraum/Gemeinschaftswaschmaschine",
  "Rauchwarnmelderwartung",
  "Wartung Elektro/Türanlagen",
  "Winterdienst",
  "Sonstige Betriebskosten",
];

const ALLOCATION_OPTIONS = [
  { value: "area", label: "Wohnfläche (m²)" },
  { value: "persons", label: "Personenzahl" },
  { value: "units", label: "Wohneinheiten" },
  { value: "consumption", label: "Verbrauch (Zähler)" },
  { value: "mea", label: "Miteigentumsanteil (MEA)" },
];

export default function OperatingCostWizardStep2() {
  const { id: statementId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [statement, setStatement] = useState<any>(null);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [customCostItems, setCustomCostItems] = useState<CostItem[]>([]);
  const [newCostType, setNewCostType] = useState("");

  useEffect(() => {
    if (statementId) {
      loadStatement();
    }
  }, [statementId]);

  async function loadStatement() {
    if (!statementId) return;

    setLoading(true);
    const { statement, lineItems, error } =
      await operatingCostService.getStatementDetail(statementId);

    if (error) {
      setError("Fehler beim Laden der Abrechnung");
      setLoading(false);
      return;
    }

    setStatement(statement);

    const initialItems: CostItem[] = COST_TYPES.map((costType) => {
      const existingItem = lineItems?.find(
        (item) => item.cost_type === costType
      );

      return existingItem || {
        cost_type: costType,
        allocation_key: "area",
        amount: 0,
      };
    });

    const customItems = lineItems?.filter(
      (item) => !COST_TYPES.includes(item.cost_type)
    ) || [];

    setCostItems(initialItems);
    setCustomCostItems(customItems);

    setLoading(false);
  }

  function updateCostItem(
    index: number,
    field: "allocation_key" | "amount" | "is_section_35a" | "section_35a_category",
    value: any
  ) {
    const updated = [...costItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    if (field === "is_section_35a" && value === false) {
      updated[index].section_35a_category = null;
    }

    setCostItems(updated);
  }

  function updateCustomCostItem(
    index: number,
    field: "allocation_key" | "amount" | "is_section_35a" | "section_35a_category",
    value: any
  ) {
    const updated = [...customCostItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    if (field === "is_section_35a" && value === false) {
      updated[index].section_35a_category = null;
    }

    setCustomCostItems(updated);
  }

  function addCustomCostType() {
    if (!newCostType.trim()) return;

    const newItem: CostItem = {
      cost_type: newCostType.trim(),
      allocation_key: "area",
      amount: 0,
    };

    setCustomCostItems([...customCostItems, newItem]);
    setNewCostType("");
  }

  function removeCustomCostItem(index: number) {
    const updated = customCostItems.filter((_, i) => i !== index);
    setCustomCostItems(updated);
  }

  const allCostItems = [...costItems, ...customCostItems];
  const totalCosts = allCostItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  async function handleSave() {
    if (!statementId) return;

    setSaving(true);
    setError(null);

    try {
      const itemsToSave = allCostItems.filter((item) => Number(item.amount) > 0);

      const { error } = await operatingCostService.upsertLineItems({
        statement_id: statementId,
        items: itemsToSave,
      });

      if (error) throw error;

      const { error: statusError } = await operatingCostService.updateStatementStatus(
        statementId,
        'draft'
      );

      if (statusError) throw statusError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error("Error saving line items:", err);
      setError(
        err.message || "Fehler beim Speichern. Bitte versuchen Sie es erneut."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    if (!statementId) return;

    await handleSave();

    if (!error) {
      navigate(`/abrechnungen/betriebskosten/${statementId}/versand`);
    }
  }

  function handleBack() {
    navigate("/dashboard?view=billing&tab=operating-costs");
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">
            Betriebskostenabrechnung {statement?.year}
          </h1>
          <p className="text-gray-400">
            Erfassen Sie die Betriebskosten für das Abrechnungsjahr
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

            <div className="flex-1 h-0.5 bg-primary-blue -mt-6" />

            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-semibold mb-2">
                2
              </div>
              <span className="text-sm font-medium text-primary-blue">
                Kosten erfassen
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-200 -mt-6" />

            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-semibold mb-2">
                3
              </div>
              <span className="text-sm text-gray-400">Versand</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-dark">
              Schritt 2: Betriebskosten erfassen
            </h2>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="secondary"
            >
              {saving ? (
                <>
                  Speichert...
                </>
              ) : saveSuccess ? (
                <>
                  Gespeichert
                </>
              ) : (
                'Speichern'
              )}
            </Button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Fehler</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Kostenart
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Umlageschlüssel
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Betrag (EUR)
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>§35a EStG</span>
                      <div className="group relative inline-block">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 fixed z-[99999] w-80 p-4 bg-gray-900 text-white text-sm font-normal rounded-lg shadow-2xl pointer-events-none" style={{marginTop: '-100px', marginLeft: '-150px'}}>
                          <div className="text-left leading-relaxed">
                            Hinweis: Die steuerliche Einordnung erfolgt auf Basis Ihrer Auswahl. Rentably übernimmt keine steuerliche Beratung.
                          </div>
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Kategorie (§35a)
                  </th>
                </tr>
              </thead>
              <tbody>
                {costItems.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <span className="text-gray-900">{item.cost_type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.allocation_key}
                        onChange={(e) =>
                          updateCostItem(
                            index,
                            "allocation_key",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                      >
                        {ALLOCATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount || ""}
                        onChange={(e) =>
                          updateCostItem(
                            index,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-right"
                        placeholder="0,00"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={item.is_section_35a || false}
                        onChange={(e) =>
                          updateCostItem(
                            index,
                            "is_section_35a",
                            e.target.checked
                          )
                        }
                        className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-primary-blue rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.section_35a_category || ""}
                        onChange={(e) =>
                          updateCostItem(
                            index,
                            "section_35a_category",
                            e.target.value || null
                          )
                        }
                        disabled={!item.is_section_35a}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">Bitte wählen</option>
                        <option value="haushaltsnahe_dienstleistungen">Haushaltsnahe Dienstleistungen</option>
                        <option value="handwerkerleistungen">Handwerkerleistungen</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={2} className="py-4 px-4 text-right font-bold">
                    Gesamtkosten:
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-lg text-primary-blue">
                    {totalCosts.toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4 mt-6">
            <p className="text-sm font-medium text-blue-900 mb-2">Hinweise zur Erfassung:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">
              <li>
                Der <strong>Umlageschlüssel</strong> bestimmt, wie die Kosten auf die Mieter verteilt werden.
              </li>
              <li>
                Markieren Sie Kosten als <strong>§35a EStG-relevant</strong>, wenn diese steuerlich absetzbar sind (z.B. Hauswart, Gartenpflege, Schornsteinreinigung).
              </li>
              <li>
                Wählen Sie die passende <strong>Kategorie</strong>: Haushaltsnahe Dienstleistungen (max. 4.000€/Jahr) oder Handwerkerleistungen (max. 1.200€/Jahr).
              </li>
            </ul>
          </div>
        </div>

        {customCostItems.length > 0 && (
          <div className="bg-white rounded-lg p-8 shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-dark mb-4">Eigene Kostenarten</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Kostenart
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Umlageschlüssel
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Betrag (EUR)
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>§35a EStG</span>
                        <div className="group relative inline-block">
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 fixed z-[99999] w-80 p-4 bg-gray-900 text-white text-sm font-normal rounded-lg shadow-2xl pointer-events-none" style={{marginTop: '-100px', marginLeft: '-150px'}}>
                            <div className="text-left leading-relaxed">
                              Hinweis: Die steuerliche Einordnung erfolgt auf Basis Ihrer Auswahl. Rentably übernimmt keine steuerliche Beratung.
                            </div>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Kategorie (§35a)
                    </th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {customCostItems.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <span className="text-gray-900">{item.cost_type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.allocation_key}
                          onChange={(e) =>
                            updateCustomCostItem(
                              index,
                              "allocation_key",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                        >
                          {ALLOCATION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount || ""}
                          onChange={(e) =>
                            updateCustomCostItem(
                              index,
                              "amount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-right"
                          placeholder="0,00"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={item.is_section_35a || false}
                          onChange={(e) =>
                            updateCustomCostItem(
                              index,
                              "is_section_35a",
                              e.target.checked
                            )
                          }
                          className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-primary-blue rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.section_35a_category || ""}
                          onChange={(e) =>
                            updateCustomCostItem(
                              index,
                              "section_35a_category",
                              e.target.value || null
                            )
                          }
                          disabled={!item.is_section_35a}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">Bitte wählen</option>
                          <option value="haushaltsnahe_dienstleistungen">Haushaltsnahe Dienstleistungen</option>
                          <option value="handwerkerleistungen">Handwerkerleistungen</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => removeCustomCostItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Entfernen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-8 shadow-sm mt-6">
          <h3 className="text-lg font-semibold text-dark mb-4">Eigene Kostenart hinzufügen</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={newCostType}
              onChange={(e) => setNewCostType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomCostType()}
              placeholder="z.B. Hausmeisterdienst"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
            <Button
              onClick={addCustomCostType}
              disabled={!newCostType.trim()}
              variant="primary"
            >
              Hinzufügen
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button
            onClick={handleBack}
            variant="secondary"
            disabled={saving}
          >
            Zurück
          </Button>

          <Button
            onClick={handleNext}
            disabled={saving || totalCosts === 0}
            variant="primary"
          >
            {saving ? (
              <>
                Speichert...
              </>
            ) : (
              'Weiter'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
