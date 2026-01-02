import { useState, useEffect } from 'react';
import { Plus, Building2, Edit2, Trash2, TrendingUp, Euro } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PropertyModal from './PropertyModal';
import PropertyDetails from './PropertyDetails';

interface Property {
  id: string;
  name: string;
  address: string;
  property_type: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  size_sqm: number | null;
  rooms: number | null;
  parking_spot_number?: string;
  description: string;
}

export default function PropertiesView() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [user]);

  const loadProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diese Immobilie wirklich löschen?')) return;

    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
      loadProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (showDetails && selectedProperty) {
    return (
      <PropertyDetails
        property={selectedProperty}
        onBack={() => {
          setShowDetails(false);
          setSelectedProperty(null);
          loadProperties();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">Immobilien</h1>
          <p className="text-gray-400">Verwalten Sie Ihre Immobilien und deren Details</p>
        </div>
        <button
          onClick={() => {
            setSelectedProperty(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
        >
          <Plus className="w-5 h-5" />
          Immobilie hinzufügen
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">
            Noch keine Immobilien
          </h3>
          <p className="text-gray-400 mb-6">
            Fügen Sie Ihre erste Immobilie hinzu, um mit der Verwaltung zu beginnen.
          </p>
          <button
            onClick={() => {
              setSelectedProperty(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-5 h-5" />
            Erste Immobilie hinzufügen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProperty(property);
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-300 hover:text-primary-blue transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-dark mb-1">{property.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{property.address}</p>

                <div className="space-y-2 mb-4">
                  {property.rooms && (
                    <div className="text-sm text-gray-400">
                      {property.rooms} Zimmer
                      {property.size_sqm && ` • ${property.size_sqm} m²`}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-gray-300" />
                    <span className="text-sm font-medium text-dark">
                      {formatCurrency(property.current_value)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedProperty(property);
                    setShowDetails(true);
                  }}
                  className="w-full px-4 py-2 bg-gray-50 text-gray-400 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Details ansehen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => {
            setShowModal(false);
            setSelectedProperty(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedProperty(null);
            loadProperties();
          }}
        />
      )}
    </div>
  );
}
