import { useState, useEffect } from "react";
import { X, Check, ChevronLeft, ChevronRight, Eye, Download, Loader, Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import jsPDF from "jspdf";

interface AutomaticTemplateWizardProps {
  onClose: () => void;
}

interface TemplateCategory {
  id: string;
  name: string;
  templates: TemplateOption[];
}

interface TemplateOption {
  id: string;
  title: string;
  subtitle: string;
}

interface LandlordData {
  name: string;
  zip: string;
  city: string;
  street: string;
  number: string;
  prefix: string;
  country: string;
}

interface TenantData {
  id?: string;
  name: string;
  zip: string;
  city: string;
  street: string;
  number: string;
  prefix: string;
  country: string;
}

interface GreetingData {
  hasPersonalGreeting: boolean;
  greetingText: string;
}

interface SubjectMatterData {
  [key: string]: string;
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: "begehungsankuendigung",
    name: "Begehungsankündigung",
    templates: [
      { id: "begehung_allgemein", title: "Allgemeine Begehungsankündigung", subtitle: "Begehungsankündigung" },
      { id: "begehung_wartung", title: "Begehung zur Wartung", subtitle: "Begehungsankündigung" },
      { id: "begehung_reparatur", title: "Begehung zur Reparatur", subtitle: "Begehungsankündigung" },
      { id: "begehung_besichtigung", title: "Besichtigungstermin", subtitle: "Begehungsankündigung" },
      { id: "begehung_auszug", title: "Begehung vor Auszug", subtitle: "Begehungsankündigung" },
    ],
  },
  {
    id: "kuendigung",
    name: "Kündigung",
    templates: [
      { id: "raeumungsaufforderung", title: "Räumungsaufforderung an einen gekündigten Mieter:eine gekündigte Miet", subtitle: "Kündigung" },
      { id: "kuendigung_abmahnung", title: "Kündigung nach Abmahnung", subtitle: "Kündigung" },
      { id: "kuendigungsbestaetigung", title: "Kündigungsbestätigung", subtitle: "Kündigung" },
      { id: "kuendigung_eigenbedarf", title: "Kündigung wegen Eigenbedarf", subtitle: "Kündigung" },
      { id: "kuendigung_zahlungsverzug", title: "Kündigung wegen Zahlungsverzug", subtitle: "Kündigung" },
      { id: "rueckgriff_mietkaution", title: "Rückgriff auf deine Mietkaution wegen Mietrückstand", subtitle: "Kündigung" },
    ],
  },
  {
    id: "abmahnung",
    name: "Abmahnung",
    templates: [
      { id: "abmahnung_laerm", title: "Abmahnung wegen Lärmbelästigung", subtitle: "Abmahnung" },
      { id: "abmahnung_zahlung", title: "Abmahnung wegen Zahlungsverzug", subtitle: "Abmahnung" },
      { id: "abmahnung_haustier", title: "Abmahnung wegen unerlaubter Tierhaltung", subtitle: "Abmahnung" },
      { id: "abmahnung_pflege", title: "Abmahnung wegen Pflichtverletzung", subtitle: "Abmahnung" },
    ],
  },
  {
    id: "sonstiges",
    name: "Sonstiges",
    templates: [
      { id: "mietminderung_ablehnung", title: "Ablehnung einer Mietminderung", subtitle: "Sonstiges" },
      { id: "renovierung_ankuendigung", title: "Renovierungsankündigung", subtitle: "Sonstiges" },
      { id: "mieterhoehung", title: "Mieterhöhungsankündigung", subtitle: "Sonstiges" },
      { id: "betriebskosten", title: "Betriebskostenabrechnung Anschreiben", subtitle: "Sonstiges" },
      { id: "schluesselrueckgabe", title: "Erinnerung Schlüsselrückgabe", subtitle: "Sonstiges" },
      { id: "wartungsarbeiten", title: "Ankündigung von Wartungsarbeiten", subtitle: "Sonstiges" },
      { id: "hausordnung", title: "Erinnerung an Hausordnung", subtitle: "Sonstiges" },
      { id: "allgemein", title: "Allgemeines Anschreiben", subtitle: "Sonstiges" },
    ],
  },
];

export default function AutomaticTemplateWizard({ onClose }: AutomaticTemplateWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>("");

  const [landlordData, setLandlordData] = useState<LandlordData>({
    name: "",
    zip: "",
    city: "",
    street: "",
    number: "",
    prefix: "",
    country: "Deutschland",
  });

  const [tenantDataList, setTenantDataList] = useState<TenantData[]>([
    {
      name: "",
      zip: "",
      city: "",
      street: "",
      number: "",
      prefix: "",
      country: "Deutschland",
    },
  ]);

  const [greetingData, setGreetingData] = useState<GreetingData>({
    hasPersonalGreeting: false,
    greetingText: "",
  });

  const [subjectMatter, setSubjectMatter] = useState<SubjectMatterData>({});

  useEffect(() => {
    if (user) {
      loadUserData();
      loadTenants();
      loadProperties();
    }
  }, [user]);

  async function loadUserData() {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (userData) {
        setLandlordData({
          name: userData.full_name || "",
          zip: userData.zip || "",
          city: userData.city || "",
          street: userData.street || "",
          number: userData.house_number || "",
          prefix: "",
          country: "Deutschland",
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  async function loadTenants() {
    try {
      const { data } = await supabase
        .from("tenants")
        .select("*, properties(address, city, zip, street, house_number)")
        .eq("user_id", user?.id);

      if (data) {
        setTenants(data);
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  }

  async function loadProperties() {
    try {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user?.id);

      if (data) {
        setProperties(data);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  function addTenant() {
    setTenantDataList([
      ...tenantDataList,
      {
        name: "",
        zip: "",
        city: "",
        street: "",
        number: "",
        prefix: "",
        country: "Deutschland",
      },
    ]);
  }

  function removeTenant(index: number) {
    if (tenantDataList.length > 1) {
      setTenantDataList(tenantDataList.filter((_, i) => i !== index));
    }
  }

  function selectTenantFromDatabase(index: number, tenantId: string) {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      const updatedList = [...tenantDataList];
      updatedList[index] = {
        id: tenant.id,
        name: `${tenant.first_name} ${tenant.last_name}`,
        zip: tenant.properties?.zip || tenant.zip || "",
        city: tenant.properties?.city || tenant.city || "",
        street: tenant.properties?.street || tenant.street || "",
        number: tenant.properties?.house_number || tenant.house_number || "",
        prefix: tenant.prefix || "",
        country: "Deutschland",
      };
      setTenantDataList(updatedList);
    }
  }

  function updateTenantData(index: number, field: keyof TenantData, value: string) {
    const updatedList = [...tenantDataList];
    updatedList[index] = { ...updatedList[index], [field]: value };
    setTenantDataList(updatedList);
  }

  async function generatePDF() {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      doc.setFontSize(10);
      doc.text(landlordData.name, margin, yPos);
      yPos += 5;
      if (landlordData.prefix) {
        doc.text(landlordData.prefix, margin, yPos);
        yPos += 5;
      }
      doc.text(`${landlordData.street} ${landlordData.number}`, margin, yPos);
      yPos += 5;
      doc.text(`${landlordData.zip} ${landlordData.city}`, margin, yPos);
      yPos += 5;
      doc.text(landlordData.country, margin, yPos);

      yPos += 20;

      tenantDataList.forEach((tenant, index) => {
        if (index > 0) yPos += 10;
        doc.setFontSize(10);
        doc.text(tenant.name, margin, yPos);
        yPos += 5;
        if (tenant.prefix) {
          doc.text(tenant.prefix, margin, yPos);
          yPos += 5;
        }
        doc.text(`${tenant.street} ${tenant.number}`, margin, yPos);
        yPos += 5;
        doc.text(`${tenant.zip} ${tenant.city}`, margin, yPos);
        yPos += 5;
        doc.text(tenant.country, margin, yPos);
      });

      yPos += 20;

      doc.setFontSize(10);
      const today = new Date().toLocaleDateString("de-DE");
      doc.text(today, margin, yPos);

      yPos += 15;

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(selectedTemplate?.title || "Dokument", margin, yPos);

      yPos += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");

      if (greetingData.hasPersonalGreeting && greetingData.greetingText) {
        const lines = doc.splitTextToSize(greetingData.greetingText, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin, yPos);
          yPos += 6;
        });
        yPos += 5;
      } else {
        const greeting = tenantDataList.length > 1 ? "Sehr geehrte Damen und Herren," : "Sehr geehrte Damen und Herren,";
        doc.text(greeting, margin, yPos);
        yPos += 10;
      }

      Object.entries(subjectMatter).forEach(([key, value]) => {
        if (value) {
          const lines = doc.splitTextToSize(value, pageWidth - 2 * margin);
          lines.forEach((line: string) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(line, margin, yPos);
            yPos += 6;
          });
          yPos += 5;
        }
      });

      yPos += 10;
      doc.text("Mit freundlichen Grüßen,", margin, yPos);
      yPos += 15;
      doc.text(landlordData.name, margin, yPos);

      const pdfBlob = doc.output("blob");
      const fileName = `${selectedTemplate?.title}_${new Date().toISOString().split("T")[0]}.pdf`;

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await savePDFToDatabase(pdfBlob, fileName);

      alert("PDF erfolgreich erstellt und heruntergeladen!");
      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Fehler beim Erstellen des PDFs");
    } finally {
      setLoading(false);
    }
  }

  async function savePDFToDatabase(blob: Blob, fileName: string) {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const base64 = await base64Promise;

      for (const tenantData of tenantDataList) {
        if (tenantData.id) {
          const tenant = tenants.find((t) => t.id === tenantData.id);
          if (tenant && tenant.property_id) {
            await supabase.from("property_documents").insert([
              {
                property_id: tenant.property_id,
                user_id: user?.id,
                document_name: fileName,
                document_type: "automatische_vorlage",
                file_url: base64,
                file_size: blob.size,
                shared_with_tenant: false,
                unit_id: tenant.unit_id || null,
              },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Error saving PDF to database:", error);
    }
  }

  function goToNextStep() {
    if (currentStep === 1 && (!selectedCategory || !selectedTemplate)) {
      alert("Bitte wählen Sie eine Vorlage aus");
      return;
    }
    if (currentStep === 2 && (!landlordData.name || !landlordData.city || !landlordData.street)) {
      alert("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }
    if (currentStep === 3) {
      for (const tenant of tenantDataList) {
        if (!tenant.name || !tenant.city || !tenant.street) {
          alert("Bitte füllen Sie alle Pflichtfelder für alle Mieter aus");
          return;
        }
      }
    }
    setCurrentStep(currentStep + 1);
  }

  function goToPreviousStep() {
    setCurrentStep(currentStep - 1);
  }

  const steps = [
    { number: 1, name: "Vorlage auswählen" },
    { number: 2, name: "Vermieter:in" },
    { number: 3, name: "Mieter:innen" },
    { number: 4, name: selectedTemplate?.title || "Kündigungsbestätigung" },
    { number: 5, name: "Ergebnis" },
  ];

  const selectedCategoryData = TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-dark">Automatische Vorlage erstellen</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      currentStep === step.number
                        ? "bg-primary-blue text-white"
                        : currentStep > step.number
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      currentStep === step.number
                        ? "text-primary-blue font-medium"
                        : currentStep > step.number
                        ? "text-emerald-500 font-medium"
                        : "text-gray-400"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      currentStep > step.number ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-dark mb-6">Wähle eine Vorlage</h3>

              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Finde deine Vorlage"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>

              <div className="space-y-4">
                {TEMPLATE_CATEGORIES.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        setSelectedCategory(selectedCategory === category.id ? null : category.id)
                      }
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-dark">{category.name}</h4>
                          <p className="text-sm text-gray-500">{category.templates.length} Vorlagen</p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          selectedCategory === category.id ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {selectedCategory === category.id && (
                      <div className="bg-gray-50 p-4 space-y-2">
                        {category.templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template)}
                            className={`w-full p-4 rounded-lg text-left transition-colors ${
                              selectedTemplate?.id === template.id
                                ? "bg-blue-50 border-2 border-primary-blue"
                                : "bg-white border border-gray-200 hover:border-primary-blue"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <h5 className="font-medium text-dark">{template.title}</h5>
                                <p className="text-sm text-gray-500">{template.subtitle}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-dark mb-8">Vermieter:in</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vermieter:in *<br />
                    Vor- und Nachname *
                  </label>
                  <input
                    type="text"
                    value={landlordData.name}
                    onChange={(e) => setLandlordData({ ...landlordData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Simon Schier"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PLZ *</label>
                    <input
                      type="text"
                      value={landlordData.zip}
                      onChange={(e) => setLandlordData({ ...landlordData, zip: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="10179"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stadt *</label>
                    <input
                      type="text"
                      value={landlordData.city}
                      onChange={(e) => setLandlordData({ ...landlordData, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="Berlin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Straße *</label>
                    <input
                      type="text"
                      value={landlordData.street}
                      onChange={(e) => setLandlordData({ ...landlordData, street: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="Alte Jakobstraße"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nr *</label>
                    <input
                      type="text"
                      value={landlordData.number}
                      onChange={(e) => setLandlordData({ ...landlordData, number: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Präfix</label>
                  <input
                    type="text"
                    value={landlordData.prefix}
                    onChange={(e) => setLandlordData({ ...landlordData, prefix: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="z.B. Links, 2,21"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Land</label>
                  <select
                    value={landlordData.country}
                    onChange={(e) => setLandlordData({ ...landlordData, country: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="Deutschland">Deutschland</option>
                    <option value="Österreich">Österreich</option>
                    <option value="Schweiz">Schweiz</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-dark mb-8">Mieter:innen</h3>

              {tenantDataList.map((tenant, index) => (
                <div key={index} className="mb-8 p-6 bg-gray-50 rounded-lg relative">
                  {tenantDataList.length > 1 && (
                    <button
                      onClick={() => removeTenant(index)}
                      className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}

                  <h4 className="text-lg font-semibold text-dark mb-4">Mieter:in {index + 1}</h4>

                  {tenants.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aus vorhandenen Mietern auswählen
                      </label>
                      <select
                        onChange={(e) => selectTenantFromDatabase(index, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      >
                        <option value="">Mieter auswählen...</option>
                        {tenants.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.first_name} {t.last_name} - {t.properties?.address || "Keine Adresse"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vor- und Nachname *
                      </label>
                      <input
                        type="text"
                        value={tenant.name}
                        onChange={(e) => updateTenantData(index, "name", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="Florian Esterl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">PLZ *</label>
                        <input
                          type="text"
                          value={tenant.zip}
                          onChange={(e) => updateTenantData(index, "zip", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          placeholder="13187"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stadt *</label>
                        <input
                          type="text"
                          value={tenant.city}
                          onChange={(e) => updateTenantData(index, "city", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          placeholder="Berlin"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Straße *</label>
                        <input
                          type="text"
                          value={tenant.street}
                          onChange={(e) => updateTenantData(index, "street", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          placeholder="Mühlenstraße"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nr *</label>
                        <input
                          type="text"
                          value={tenant.number}
                          onChange={(e) => updateTenantData(index, "number", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          placeholder="61"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Präfix</label>
                      <input
                        type="text"
                        value={tenant.prefix}
                        onChange={(e) => updateTenantData(index, "prefix", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="z.B. Links, 2,21"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Land</label>
                      <select
                        value={tenant.country}
                        onChange={(e) => updateTenantData(index, "country", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      >
                        <option value="Deutschland">Deutschland</option>
                        <option value="Österreich">Österreich</option>
                        <option value="Schweiz">Schweiz</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addTenant}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-blue hover:text-primary-blue transition-colors w-full justify-center"
              >
                <Plus className="w-5 h-5" />
                Weiteren Empfänger:in hinzufügen
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-dark mb-8">Ansprache</h3>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">Möchtest du eine persönliche Begrüßung hinzufügen?</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setGreetingData({ ...greetingData, hasPersonalGreeting: false })}
                    className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                      !greetingData.hasPersonalGreeting
                        ? "border-primary-blue bg-blue-50 text-primary-blue"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Nein
                  </button>
                  <button
                    onClick={() => setGreetingData({ ...greetingData, hasPersonalGreeting: true })}
                    className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                      greetingData.hasPersonalGreeting
                        ? "border-primary-blue bg-blue-50 text-primary-blue"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Ja
                  </button>
                </div>
              </div>

              {greetingData.hasPersonalGreeting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schreibe deine Nachricht hier
                  </label>
                  <textarea
                    value={greetingData.greetingText}
                    onChange={(e) => setGreetingData({ ...greetingData, greetingText: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                    placeholder="Ihre persönliche Begrüßung..."
                  />
                </div>
              )}

              <div className="mt-8">
                <h4 className="font-semibold text-dark mb-4">Sachverhalt</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschreibung des Sachverhalts
                    </label>
                    <textarea
                      value={subjectMatter.description || ""}
                      onChange={(e) => setSubjectMatter({ ...subjectMatter, description: e.target.value })}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                      placeholder="Bitte beschreiben Sie den Sachverhalt..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-4">Dokument bereit!</h3>
              <p className="text-gray-600 mb-8">
                Ihr personalisiertes Dokument wurde erfolgreich erstellt und ist bereit zum Download.
                Das Dokument wurde auch automatisch den ausgewählten Mietern zugeordnet.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-dark">{selectedTemplate?.title}</h4>
                      <p className="text-sm text-gray-500">PDF-Dokument • DIN A4</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={generatePDF}
                disabled={loading}
                className="px-8 py-4 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    PDF herunterladen
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={currentStep === 1 ? onClose : goToPreviousStep}
            className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            {currentStep === 1 ? (
              <>Abbrechen</>
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                Zurück
              </>
            )}
          </button>

          <div className="flex gap-3">
            {currentStep < 5 && (
              <button
                onClick={() => {}}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Vorschau
              </button>
            )}
            {currentStep < 5 && (
              <button
                onClick={goToNextStep}
                className="px-6 py-3 bg-dark text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
              >
                Weiter
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
