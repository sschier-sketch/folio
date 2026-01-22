import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  Package,
  Zap,
  FileText,
  Clock,
  Users,
  Wrench,
  BarChart3,
  Building2,
  Camera,
  Trash2,
} from "lucide-react";
import PropertyOverviewTab from "./property/PropertyOverviewTab";
import PropertyUnitsTab from "./property/PropertyUnitsTab";
import PropertyEquipmentTab from "./property/PropertyEquipmentTab";
import PropertyDocumentsTab from "./property/PropertyDocumentsTab";
import PropertyHistoryTab from "./property/PropertyHistoryTab";
import PropertyContactsTab from "./property/PropertyContactsTab";
import PropertyMaintenanceTab from "./property/PropertyMaintenanceTab";
import PropertyMetricsTab from "./property/PropertyMetricsTab";
import ScrollableTabNav from "./common/ScrollableTabNav";
import Badge from "./common/Badge";
import { supabase } from "../lib/supabase";

interface Property {
  id: string;
  name: string;
  address: string;
  property_type: string;
  property_management_type?: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  size_sqm: number | null;
  parking_spot_number?: string;
  description: string;
  photo_url?: string | null;
}

interface PropertyDetailsProps {
  property: Property;
  onBack: () => void;
  onNavigateToTenant?: (tenantId: string) => void;
  initialTab?: Tab;
  onUpdate?: () => void;
}

type Tab =
  | "overview"
  | "units"
  | "equipment"
  | "documents"
  | "history"
  | "contacts"
  | "maintenance"
  | "metrics";

export default function PropertyDetails({ property, onBack, onNavigateToTenant, initialTab, onUpdate }: PropertyDetailsProps) {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || tabFromUrl || "overview");
  const [currentProperty, setCurrentProperty] = useState<Property>(property);
  const [photoUrl, setPhotoUrl] = useState<string | null>(property.photo_url || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setCurrentProperty(property);
    setPhotoUrl(property.photo_url || null);
  }, [property]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, initialTab]);

  const handlePropertyUpdate = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property.id)
      .single();

    if (data && !error) {
      setCurrentProperty(data);
      setPhotoUrl(data.photo_url || null);
    }

    if (onUpdate) {
      onUpdate();
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximal 5MB erlaubt.');
      return;
    }

    setUploading(true);
    try {
      if (photoUrl) {
        const oldPath = photoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('property-photos')
            .remove([`${property.id}/${oldPath}`]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${property.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('properties')
        .update({ photo_url: publicUrl })
        .eq('id', property.id);

      if (updateError) throw updateError;

      setPhotoUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Fehler beim Hochladen des Fotos');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!photoUrl || !confirm('Möchten Sie das Foto wirklich löschen?')) return;

    setUploading(true);
    try {
      const oldPath = photoUrl.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('property-photos')
          .remove([`${property.id}/${oldPath}`]);
      }

      const { error } = await supabase
        .from('properties')
        .update({ photo_url: null })
        .eq('id', property.id);

      if (error) throw error;

      setPhotoUrl(null);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Fehler beim Löschen des Fotos');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: "overview" as Tab, label: "Überblick", icon: Home },
    { id: "units" as Tab, label: "Einheiten", icon: Package },
    { id: "equipment" as Tab, label: "Ausstattung & Daten", icon: Zap },
    { id: "history" as Tab, label: "Historie", icon: Clock, isPro: true },
    { id: "documents" as Tab, label: "Dokumente", icon: FileText, isPro: true },
    { id: "contacts" as Tab, label: "Kontakte", icon: Users, isPro: true },
    { id: "maintenance" as Tab, label: "Instandhaltung", icon: Wrench, isPro: true },
    { id: "metrics" as Tab, label: "Kennzahlen", icon: BarChart3, isPro: true },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        style={{ backgroundColor: "#faf8f8", color: "#000000" }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#bdbfcb] mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück zur Übersicht
      </button>

      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-12 h-12 text-primary-blue" />
              )}
            </div>

            <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label style={{ backgroundColor: "#faf8f8" }} className="cursor-pointer p-2 rounded-full hover:bg-[#bdbfcb] transition-colors">
                <Camera className="w-5 h-5 text-gray-700" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {photoUrl && (
                <button
                  onClick={handlePhotoDelete}
                  style={{ backgroundColor: "#faf8f8" }}
                  className="p-2 rounded-full hover:bg-[#bdbfcb] transition-colors"
                  disabled={uploading}
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              )}
            </div>

            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-xs">Lädt...</div>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-dark mb-2">{currentProperty.name}</h1>
            <p className="text-gray-400">{currentProperty.address}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg mb-6">
        <ScrollableTabNav>
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary-blue"
                      : "text-gray-400 hover:text-dark"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.isPro && (
                    <Badge variant="pro" size="sm">Pro</Badge>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollableTabNav>
      </div>

      <div>
        {activeTab === "overview" && <PropertyOverviewTab property={currentProperty} onNavigateToTenant={onNavigateToTenant} onUpdate={handlePropertyUpdate} />}
        {activeTab === "units" && <PropertyUnitsTab propertyId={currentProperty.id} />}
        {activeTab === "equipment" && <PropertyEquipmentTab propertyId={currentProperty.id} />}
        {activeTab === "documents" && <PropertyDocumentsTab propertyId={currentProperty.id} />}
        {activeTab === "history" && <PropertyHistoryTab propertyId={currentProperty.id} />}
        {activeTab === "contacts" && <PropertyContactsTab propertyId={currentProperty.id} />}
        {activeTab === "maintenance" && (
          <PropertyMaintenanceTab propertyId={currentProperty.id} />
        )}
        {activeTab === "metrics" && <PropertyMetricsTab propertyId={currentProperty.id} />}
      </div>
    </div>
  );
}
