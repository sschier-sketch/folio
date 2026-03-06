import { useState, useEffect, useRef } from "react";
import { TrendingUp, Calendar, CheckCircle2, Trash2, CreditCard as Edit, Upload, FileText, X, CheckCircle, Clock, AlertCircle, Receipt, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import TableActionsDropdown, { ActionItem } from "../common/TableActionsDropdown";
import { Button } from "../ui/Button";

interface ExpenseCategory {
  id: string;
  name: string;
}

interface ManualIncome {
  id: string;
  property_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  entry_date: string;
  status: string;
  recipient: string | null;
  due_date: string | null;
  is_cashflow_relevant: boolean;
  vat_rate: number;
  is_apportionable: boolean;
  is_labor_cost: boolean;
  ignore_in_operating_costs: boolean;
  notes: string | null;
  document_id: string | null;
  properties: {
    name: string;
  };
}

interface ContractUnitInfo {
  label: string | null;
  unit_number: string;
  unit_type: string;
  rent_included: boolean;
  separate_rent: number;
  separate_additional_costs: number;
}

interface RentalContract {
  id: string;
  total_rent: number;
  base_rent: number;
  additional_costs: number;
  start_date: string;
  contract_start: string;
  contract_end: string | null;
  status: string;
  tenants?: {
    first_name: string;
    last_name: string;
  } | null;
  properties?: {
    name: string;
  };
  units?: ContractUnitInfo[];
}

interface NebenkostenPayment {
  id: string;
  property_id: string;
  tenant_id: string | null;
  due_date: string;
  amount: number;
  paid_amount: number;
  payment_status: string;
  description: string | null;
  notes: string | null;
  created_at: string;
  tenant_name?: string;
  property_name?: string;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_number: string;
  property_id: string;
}

export default function IncomeView() {
  const { user } = useAuth();
  const { dataOwnerId, filterPropertiesByScope, filterByPropertyId, canWrite, loading: permLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [manualIncomes, setManualIncomes] = useState<ManualIncome[]>([]);
  const [nebenkostenPayments, setNebenkostenPayments] = useState<NebenkostenPayment[]>([]);
  const [rentalContracts, setRentalContracts] = useState<RentalContract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [timePeriod, setTimePeriod] = useState<"current" | "last" | "all">("current");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<ManualIncome | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [existingDocument, setExistingDocument] = useState<{id: string, file_name: string, file_path: string} | null>(null);
  const [formData, setFormData] = useState({
    property_id: "",
    unit_id: "",
    category_id: "",
    amount: "",
    entry_date: new Date().toISOString().split("T")[0],
    due_date: "",
    description: "",
    recipient: "",
    notes: "",
    status: "open",
    vat_rate: "19",
    is_apportionable: false,
    is_labor_cost: false,
    ignore_in_operating_costs: false,
    is_cashflow_relevant: true,
  });

  useEffect(() => {
    if (user && !permLoading && dataOwnerId) {
      loadProperties();
      loadData();
    }
  }, [user, permLoading, dataOwnerId, timePeriod, selectedProperty, selectedUnit, startDate, endDate]);

  async function loadProperties() {
    if (!dataOwnerId) return;
    try {
      const [propertiesRes, unitsRes, categoriesRes] = await Promise.all([
        supabase.from("properties").select("id, name").eq("user_id", dataOwnerId).order("name"),
        supabase.from("property_units").select("id, unit_number, property_id").eq("user_id", dataOwnerId).order("unit_number"),
        supabase.from("expense_categories").select("*").order("name"),
      ]);

      setProperties(filterPropertiesByScope(propertiesRes.data || []));
      if (unitsRes.data) setUnits(filterByPropertyId(unitsRes.data));
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  async function loadData() {
    try {
      setLoading(true);

      let filterStartDate = startDate;
      let filterEndDate = endDate;

      if (!startDate || !endDate) {
        const now = new Date();
        const currentYear = now.getFullYear();

        if (timePeriod === "current") {
          filterStartDate = `${currentYear}-01-01`;
          filterEndDate = `${currentYear}-12-31`;
        } else if (timePeriod === "last") {
          filterStartDate = `${currentYear - 1}-01-01`;
          filterEndDate = `${currentYear - 1}-12-31`;
        }
      }

      let manualQuery = supabase
        .from("income_entries")
        .select("id, property_id, category_id, description, amount, entry_date, status, recipient, due_date, is_cashflow_relevant, vat_rate, is_apportionable, is_labor_cost, ignore_in_operating_costs, notes, document_id, properties(name)")
        .eq("user_id", dataOwnerId!)
        .order("entry_date", { ascending: false });

      if (selectedProperty) {
        manualQuery = manualQuery.eq("property_id", selectedProperty);
      }

      if (timePeriod !== "all" && filterStartDate && filterEndDate) {
        manualQuery = manualQuery
          .gte("entry_date", filterStartDate)
          .lte("entry_date", filterEndDate);
      }

      let contractsQuery = supabase
        .from("rental_contracts")
        .select(`
          id,
          total_rent,
          base_rent,
          additional_costs,
          start_date,
          contract_start,
          contract_end,
          status,
          tenant_id,
          property_id
        `)
        .eq("user_id", dataOwnerId!)
        .eq("status", "active")
        .order("start_date", { ascending: false });

      if (selectedProperty) {
        contractsQuery = contractsQuery.eq("property_id", selectedProperty);
      }

      let nkQuery = supabase
        .from("rent_payments")
        .select("id, property_id, tenant_id, due_date, amount, paid_amount, payment_status, description, notes, created_at")
        .eq("user_id", dataOwnerId!)
        .eq("payment_type", "nebenkosten")
        .order("due_date", { ascending: false });

      if (selectedProperty) {
        nkQuery = nkQuery.eq("property_id", selectedProperty);
      }

      if (timePeriod !== "all" && filterStartDate && filterEndDate) {
        nkQuery = nkQuery
          .gte("due_date", filterStartDate)
          .lte("due_date", filterEndDate);
      }

      const [manualRes, contractsRes, nkRes] = await Promise.all([manualQuery, contractsQuery, nkQuery]);

      if (manualRes.error) throw manualRes.error;
      if (contractsRes.error) throw contractsRes.error;
      if (nkRes.error) throw nkRes.error;

      setManualIncomes(manualRes.data || []);

      const nkData: NebenkostenPayment[] = nkRes.data || [];
      const tenantIds = [...new Set(nkData.filter(n => n.tenant_id).map(n => n.tenant_id!))];
      const propertyIds = [...new Set(nkData.map(n => n.property_id))];

      const [tenantMap, propMap] = await Promise.all([
        tenantIds.length > 0
          ? supabase.from("tenants").select("id, first_name, last_name").in("id", tenantIds).then(r => {
              const map: Record<string, string> = {};
              (r.data || []).forEach(t => { map[t.id] = `${t.first_name} ${t.last_name}`; });
              return map;
            })
          : Promise.resolve({} as Record<string, string>),
        propertyIds.length > 0
          ? supabase.from("properties").select("id, name").in("id", propertyIds).then(r => {
              const map: Record<string, string> = {};
              (r.data || []).forEach(p => { map[p.id] = p.name; });
              return map;
            })
          : Promise.resolve({} as Record<string, string>),
      ]);

      setNebenkostenPayments(nkData.map(n => ({
        ...n,
        tenant_name: n.tenant_id ? tenantMap[n.tenant_id] || "-" : "-",
        property_name: propMap[n.property_id] || "-",
      })));

      const contractsWithRelations = await Promise.all(
        (contractsRes.data || []).map(async (contract: any) => {
          const [tenantRes, propertyRes, unitsRes] = await Promise.all([
            supabase
              .from("tenants")
              .select("first_name, last_name")
              .eq("id", contract.tenant_id)
              .maybeSingle(),
            supabase
              .from("properties")
              .select("name")
              .eq("id", contract.property_id)
              .maybeSingle(),
            supabase
              .from("rental_contract_units")
              .select("label, rent_included, separate_rent, separate_additional_costs, unit_id")
              .eq("contract_id", contract.id),
          ]);

          let unitDetails: ContractUnitInfo[] = [];
          const rcuRows = unitsRes.data || [];
          if (rcuRows.length > 0) {
            const unitIds = rcuRows.map((r: any) => r.unit_id).filter(Boolean);
            const unitMap: Record<string, any> = {};
            if (unitIds.length > 0) {
              const { data: unitData } = await supabase
                .from("property_units")
                .select("id, unit_number, unit_type")
                .in("id", unitIds);
              (unitData || []).forEach((u: any) => { unitMap[u.id] = u; });
            }
            unitDetails = rcuRows.map((r: any) => {
              const unit = unitMap[r.unit_id];
              return {
                label: r.label,
                unit_number: unit?.unit_number || "",
                unit_type: unit?.unit_type || "apartment",
                rent_included: r.rent_included ?? true,
                separate_rent: parseFloat(r.separate_rent) || 0,
                separate_additional_costs: parseFloat(r.separate_additional_costs) || 0,
              };
            });
          }

          return {
            ...contract,
            tenants: tenantRes.data,
            properties: propertyRes.data,
            units: unitDetails,
          };
        })
      );

      setRentalContracts(contractsWithRelations);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date();
  const activeStartedContracts = rentalContracts.filter(c => {
    const startDate = new Date(c.contract_start);
    const endDate = c.contract_end ? new Date(c.contract_end) : null;
    return startDate <= today && (!endDate || endDate >= today);
  });

  const totalManualIncome = manualIncomes.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  const totalRentIncome = activeStartedContracts.reduce((sum, contract) => {
    return sum + parseFloat(contract.total_rent.toString());
  }, 0);
  const totalNebenkostenIncome = nebenkostenPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalNebenkostenPaid = nebenkostenPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  const totalIncome = totalManualIncome + totalRentIncome;

  async function handleSaveIncome() {
    if (!user || !formData.property_id || !formData.amount || !formData.description || !formData.category_id) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    try {
      let documentId = null;

      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            file_name: uploadedFile.name,
            file_path: uploadData.path,
            file_type: uploadedFile.type,
            file_size: uploadedFile.size,
            document_type: 'receipt',
            category: 'income',
            description: formData.description || 'Einnahmenbeleg'
          })
          .select()
          .single();

        if (docError) throw docError;
        documentId = docData.id;

        if (documentId && formData.property_id) {
          await supabase.from('document_associations').insert({
            document_id: documentId,
            association_type: 'property',
            association_id: formData.property_id,
            created_by: user.id
          });

          if (formData.unit_id) {
            await supabase.from('document_associations').insert({
              document_id: documentId,
              association_type: 'unit',
              association_id: formData.unit_id,
              created_by: user.id
            });
          }
        }
      }

      const insertData: any = {
        user_id: user.id,
        property_id: formData.property_id,
        unit_id: formData.unit_id || null,
        category_id: formData.category_id,
        entry_date: formData.entry_date,
        due_date: formData.due_date || null,
        amount: parseFloat(formData.amount),
        description: formData.description,
        recipient: formData.recipient || null,
        status: formData.status,
        notes: formData.notes || null,
        vat_rate: parseFloat(formData.vat_rate),
        is_apportionable: formData.is_apportionable,
        is_labor_cost: formData.is_labor_cost,
        ignore_in_operating_costs: formData.ignore_in_operating_costs,
        is_cashflow_relevant: formData.is_cashflow_relevant,
        document_id: documentId,
      };

      let incomeData, error;

      if (editingIncome) {
        const result = await supabase
          .from("income_entries")
          .update(insertData)
          .eq("id", editingIncome.id)
          .select()
          .single();
        incomeData = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from("income_entries")
          .insert(insertData)
          .select()
          .single();
        incomeData = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (documentId && incomeData?.id) {
        await supabase.from('document_associations').insert({
          document_id: documentId,
          association_type: 'income',
          association_id: incomeData.id,
          created_by: user.id
        });
      }

      alert(editingIncome ? "Einnahme aktualisiert!" : "Einnahme gespeichert!");
      setShowAddModal(false);
      setEditingIncome(null);
      setExistingDocument(null);
      setUploadedFile(null);
      setFormData({
        property_id: "",
        unit_id: "",
        category_id: "",
        amount: "",
        entry_date: new Date().toISOString().split("T")[0],
        due_date: "",
        description: "",
        recipient: "",
        notes: "",
        status: "open",
        vat_rate: "19",
        is_apportionable: false,
        is_labor_cost: false,
        ignore_in_operating_costs: false,
        is_cashflow_relevant: true,
      });
      loadData();
    } catch (error) {
      console.error("Error saving income:", error);
      alert("Fehler beim Speichern: " + (error as Error).message);
    }
  }

  async function handleDeleteIncome(id: string) {
    if (!confirm("Möchten Sie diese Einnahme wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("income_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("Einnahme gelöscht!");
      loadData();
    } catch (error) {
      console.error("Error deleting income:", error);
      alert("Fehler beim Löschen: " + (error as Error).message);
    }
  }

  async function handleDownloadDocument(documentId: string) {
    try {
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('file_path, file_name')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;
      if (!document) throw new Error('Dokument nicht gefunden');

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (downloadError) throw downloadError;

      const url = URL.createObjectURL(fileData);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Fehler beim Herunterladen: ' + (error as Error).message);
    }
  }

  async function handleEditIncome(income: ManualIncome) {
    setEditingIncome(income);
    setFormData({
      property_id: income.property_id,
      unit_id: "",
      category_id: income.category_id || "",
      amount: income.amount.toString(),
      entry_date: income.entry_date,
      due_date: income.due_date || "",
      description: income.description,
      recipient: income.recipient || "",
      notes: income.notes || "",
      status: income.status,
      vat_rate: income.vat_rate?.toString() || "0",
      is_apportionable: income.is_apportionable || false,
      is_labor_cost: income.is_labor_cost || false,
      ignore_in_operating_costs: income.ignore_in_operating_costs || false,
      is_cashflow_relevant: income.is_cashflow_relevant,
    });

    if (income.document_id) {
      try {
        const { data: docData } = await supabase
          .from('documents')
          .select('id, file_name, file_path')
          .eq('id', income.document_id)
          .maybeSingle();

        if (docData) {
          setExistingDocument(docData);
        }
      } catch (error) {
        console.error('Error loading document:', error);
      }
    } else {
      setExistingDocument(null);
    }

    setUploadedFile(null);
    setShowAddModal(true);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
      case "open":
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700";
      case "open":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Bezahlt";
      case "open":
        return "Offen";
      default:
        return status;
    }
  };

  function RentBreakdownTooltip({ contract }: { contract: RentalContract }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      function handleClickOutside(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const baseRent = parseFloat(contract.base_rent.toString());
    const additionalCosts = parseFloat(contract.additional_costs.toString());
    const separateUnits = (contract.units || []).filter(u => !u.rent_included && (u.separate_rent > 0 || u.separate_additional_costs > 0));
    const hasSeparateUnits = separateUnits.length > 0;

    if (!hasSeparateUnits && Math.abs(baseRent + additionalCosts - parseFloat(contract.total_rent.toString())) < 0.01) {
      return null;
    }

    const unitTypeLabels: Record<string, string> = {
      parking: "Stellplatz",
      garage: "Garage",
      storage: "Abstellraum",
      commercial: "Gewerbe",
      apartment: "Wohnung",
      basement: "Keller",
      other: "Sonstige",
    };

    return (
      <div className="relative inline-block" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="ml-1.5 text-gray-400 hover:text-gray-600 transition-colors align-middle"
          title="Zusammensetzung anzeigen"
        >
          <Info className="w-4 h-4" />
        </button>
        {open && (
          <div className="absolute right-0 bottom-full mb-2 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-left">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Zusammensetzung</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Kaltmiete</span>
                <span className="font-medium text-gray-900">{baseRent.toFixed(2)} &euro;</span>
              </div>
              {additionalCosts > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Nebenkosten</span>
                  <span className="font-medium text-gray-900">{additionalCosts.toFixed(2)} &euro;</span>
                </div>
              )}
              {separateUnits.map((unit, idx) => {
                const unitLabel = unit.label || unitTypeLabels[unit.unit_type] || unit.unit_number;
                const unitTotal = unit.separate_rent + unit.separate_additional_costs;
                return (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-600">{unitLabel}</span>
                    <span className="font-medium text-gray-900">{unitTotal.toFixed(2)} &euro;</span>
                  </div>
                );
              })}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
                <span className="text-gray-700">Gesamt</span>
                <span className="text-gray-900">{parseFloat(contract.total_rent.toString()).toFixed(2)} &euro;</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-4 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-200"></div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objekt
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => {
                setSelectedProperty(e.target.value);
                setSelectedUnit("");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">Alle Objekte</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Einheit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              disabled={!selectedProperty}
            >
              <option value="">Alle Einheiten</option>
              {units
                .filter((u) => !selectedProperty || u.property_id === selectedProperty)
                .map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Einheit {unit.unit_number}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zeitraum
            </label>
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value as "current" | "last" | "all");
                setStartDate("");
                setEndDate("");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="current">Aktuelles Jahr</option>
              <option value="last">Letztes Jahr</option>
              <option value="all">Alle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Von
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) setTimePeriod("current");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bis
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) setTimePeriod("current");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-4 border border-[#DDE7FF]">
            <TrendingUp className="w-6 h-6 text-[#1e1e24]" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalManualIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-500">Sonstige Einnahmen</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-4 border border-[#DDE7FF]">
            <Calendar className="w-6 h-6 text-[#1e1e24]" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {rentalContracts.length}
          </div>
          <div className="text-sm text-gray-500">Aktive Mietverträge</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-4 border border-[#DDE7FF]">
            <CheckCircle2 className="w-6 h-6 text-[#1e1e24]" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalRentIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-500">Monatliche Mieteinnahmen</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mb-4 border border-[#DDE7FF]">
            <Receipt className="w-6 h-6 text-[#1e1e24]" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalNebenkostenIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-500">
            Nebenkosten-Nachzahlungen
            {totalNebenkostenPaid > 0 && (
              <span className="ml-1 text-emerald-600">({totalNebenkostenPaid.toFixed(2)} € bezahlt)</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark">Sonstige Einnahmen</h3>
          {canWrite && (
            <Button
              onClick={() => {
                setEditingIncome(null);
                setExistingDocument(null);
                setUploadedFile(null);
                setFormData({
                  property_id: "",
                  unit_id: "",
                  category_id: "",
                  amount: "",
                  entry_date: new Date().toISOString().split("T")[0],
                  due_date: "",
                  description: "",
                  recipient: "",
                  notes: "",
                  status: "open",
                  vat_rate: "19",
                  is_apportionable: false,
                  is_labor_cost: false,
                  ignore_in_operating_costs: false,
                  is_cashflow_relevant: true,
                });
                setShowAddModal(true);
              }}
              variant="primary"
            >
              Einnahme hinzufügen
            </Button>
          )}
        </div>

        {manualIncomes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {canWrite ? "Keine manuellen Einnahmen erfasst." : "Keine manuellen Einnahmen vorhanden."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beschreibung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objekt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {manualIncomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(income.entry_date).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-dark">
                      {income.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {income.properties.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(income.status)}`}>
                        {getStatusLabel(income.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark">
                      +{parseFloat(income.amount.toString()).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center justify-center">
                        <TableActionsDropdown
                          actions={[
                            ...(income.document_id ? [{
                              label: 'Beleg herunterladen',
                              onClick: () => handleDownloadDocument(income.document_id!)
                            }] : []),
                            ...(canWrite ? [{
                              label: 'Bearbeiten',
                              onClick: () => handleEditIncome(income)
                            },
                            {
                              label: 'Löschen',
                              onClick: () => handleDeleteIncome(income.id),
                              variant: 'danger' as const
                            }] : [])
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {nebenkostenPayments.length > 0 && (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-dark">Nebenkosten-Nachzahlungen</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {nebenkostenPayments.length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fällig am</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschreibung</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mieter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objekt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {nebenkostenPayments.map((nk) => {
                  const openAmount = nk.amount - (nk.paid_amount || 0);
                  return (
                    <tr key={nk.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(nk.due_date).toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-dark">
                        {nk.description || "Nebenkostennachzahlung"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {nk.tenant_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {nk.property_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          nk.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" :
                          nk.payment_status === "partial" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {nk.payment_status === "paid" ? "Bezahlt" :
                           nk.payment_status === "partial" ? "Teilzahlung" : "Offen"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="font-medium text-dark">+{nk.amount.toFixed(2)} €</div>
                        {nk.payment_status === "partial" && openAmount > 0 && (
                          <div className="text-xs text-amber-600">Offen: {openAmount.toFixed(2)} €</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-dark">Aktuelle Mietverträge</h3>
        </div>

        {rentalContracts.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">
              Keine aktiven Mietverträge
            </h3>
            <p className="text-gray-400">
              Es wurden keine aktiven Mietverträge gefunden.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vertragsbeginn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mieter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objekt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kaltmiete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NK
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gesamt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rentalContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(contract.start_date).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {contract.tenants && contract.tenants.first_name && contract.tenants.last_name
                        ? `${contract.tenants.first_name} ${contract.tenants.last_name}`
                        : "-"
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {contract.properties?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {parseFloat(contract.base_rent.toString()).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {parseFloat(contract.additional_costs.toString()).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark">
                      <span className="inline-flex items-center">
                        {parseFloat(contract.total_rent.toString()).toFixed(2)} €
                        <RentBreakdownTooltip contract={contract} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-dark mb-4">
              {editingIncome ? "Einnahme bearbeiten" : "Einnahme hinzufügen"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objekt *
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      property_id: e.target.value,
                      unit_id: "",
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Objekt wählen...</option>
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Einheit (optional)
                </label>
                <select
                  value={formData.unit_id}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Keine Einheit</option>
                  {units
                    .filter(u => !formData.property_id || u.property_id === formData.property_id)
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Einheit {unit.unit_number}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Kategorie wählen...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Betrag (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum *
                </label>
                <input
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, entry_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Parkplatzmiete Januar 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empfänger/Zahlender (optional)
                </label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) =>
                    setFormData({ ...formData, recipient: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Firma Müller GmbH"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fälligkeitsdatum (optional)
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notizen (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beleg hochladen (optional)
                </label>
                {existingDocument && !uploadedFile && (
                  <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="mb-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <FileText className="w-4 h-4" />
                        <span>Vorhandenes Dokument: {existingDocument.file_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const { data, error } = await supabase.storage
                                .from('documents')
                                .download(existingDocument.file_path);

                              if (error) throw error;

                              const url = URL.createObjectURL(data);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = existingDocument.file_name;
                              document.body.appendChild(a);
                              a.click();
                              URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error('Error downloading document:', error);
                              alert('Fehler beim Herunterladen des Dokuments');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          Herunterladen
                        </button>
                        <button
                          type="button"
                          onClick={() => setExistingDocument(null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="relative">
                  <input
                    type="file"
                    id="income-file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadedFile(file);
                    }}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="income-file-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-blue hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Datei auswählen (PDF, JPG, PNG)</span>
                  </label>
                  {uploadedFile && (
                    <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="mt-2 p-2 border rounded-lg flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 flex-1">{uploadedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MwSt-Satz
                </label>
                <select
                  value={formData.vat_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, vat_rate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="7">7%</option>
                  <option value="19">19%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zahlungsstatus
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="open">Offen</option>
                  <option value="paid">Bezahlt</option>
                </select>
              </div>

              <div className="col-span-2 border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Optionen
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label htmlFor="is_apportionable" className="text-sm text-gray-700">
                      Umlagefähig
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="is_apportionable"
                        checked={formData.is_apportionable}
                        onChange={(e) =>
                          setFormData({ ...formData, is_apportionable: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label htmlFor="is_labor_cost" className="text-sm text-gray-700">
                      Lohnkosten
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="is_labor_cost"
                        checked={formData.is_labor_cost}
                        onChange={(e) =>
                          setFormData({ ...formData, is_labor_cost: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label htmlFor="ignore_in_operating_costs" className="text-sm text-gray-700">
                      Ignoriert in BK-Abr.
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="ignore_in_operating_costs"
                        checked={formData.ignore_in_operating_costs}
                        onChange={(e) =>
                          setFormData({ ...formData, ignore_in_operating_costs: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <label htmlFor="is_cashflow_relevant" className="text-sm text-gray-700">
                      Cashflow-relevant
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="is_cashflow_relevant"
                        checked={formData.is_cashflow_relevant}
                        onChange={(e) =>
                          setFormData({ ...formData, is_cashflow_relevant: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingIncome(null);
                  setExistingDocument(null);
                  setUploadedFile(null);
                }}
                variant="cancel"
                fullWidth
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveIncome}
                variant="primary"
                fullWidth
                disabled={!formData.property_id || !formData.amount || !formData.description || !formData.category_id}
              >
                {editingIncome ? "Aktualisieren" : "Hinzufügen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
