import { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import RentalContractModal from './RentalContractModal';

interface Property {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

interface RentalContract {
  id: string;
  property_id: string;
  base_rent: number;
  additional_costs: number;
  total_rent: number;
  contract_start: string;
  contract_end: string | null;
  contract_type: string;
  notes: string;
  properties?: {
    name: string;
  };
  tenants?: Tenant[];
}

export default function TenantsView() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [contractsRes, propertiesRes] = await Promise.all([
        supabase
          .from('rental_contracts')
          .select('*, properties(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('properties').select('id, name').eq('user_id', user.id),
      ]);

      const contractsWithTenants: RentalContract[] = [];

      if (contractsRes.data) {
        for (const contract of contractsRes.data) {
          const { data: tenants } = await supabase
            .from('tenants')
            .select('*')
            .eq('contract_id', contract.id);

          contractsWithTenants.push({
            ...contract,
            tenants: tenants || [],
          });
        }
      }

      setContracts(contractsWithTenants);
      setProperties(propertiesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie dieses Mietverhältnis wirklich löschen? Alle zugehörigen Mieter werden ebenfalls gelöscht.')) return;

    try {
      const { error } = await supabase.from('rental_contracts').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting contract:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">Mietverhältnisse</h1>
          <p className="text-gray-400">Verwalten Sie Ihre Mietverhältnisse und Mieter</p>
        </div>
        <button
          onClick={() => {
            setSelectedContract(null);
            setShowContractModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
        >
          <Plus className="w-5 h-5" />
          Mietverhältnis hinzufügen
        </button>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-white rounded shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">Noch keine Mietverhältnisse</h3>
          <p className="text-gray-400 mb-6">
            Fügen Sie Ihr erstes Mietverhältnis hinzu, um mit der Verwaltung zu beginnen.
          </p>
          <button
            onClick={() => {
              setSelectedContract(null);
              setShowContractModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-5 h-5" />
            Erstes Mietverhältnis hinzufügen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contracts.map((contract) => (
            <div key={contract.id} className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden hover:transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="w-4 h-4 text-gray-300" />
                        <span className="text-sm font-medium text-dark">
                          {contract.properties?.name || 'Nicht zugeordnet'}
                        </span>
                      </div>
                      <div className="font-bold text-lg text-dark mb-1">
                        {contract.tenants && contract.tenants.length > 0
                          ? contract.tenants.map(t => `${t.first_name} ${t.last_name}`).join(', ')
                          : 'Keine Mieter'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {contract.tenants && contract.tenants.length > 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-blue/5 text-primary-blue rounded-full text-xs font-medium">
                            {contract.tenants.length} Mieter
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowContractModal(true);
                      }}
                      className="p-2 text-gray-300 hover:text-primary-blue transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contract.id)}
                      className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-300 mb-1">Kaltmiete</div>
                    <div className="font-semibold text-dark">{formatCurrency(contract.base_rent)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-300 mb-1">Warmmiete</div>
                    <div className="font-semibold text-dark">{formatCurrency(contract.total_rent)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-300 mb-1">Vertragsbeginn</div>
                    <div className="text-sm text-dark">
                      {new Date(contract.contract_start).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-300 mb-1">Vertragsart</div>
                    <div className="text-sm text-dark">
                      {contract.contract_type === 'unlimited' ? 'Unbefristet' : 'Befristet'}
                    </div>
                  </div>
                </div>

                {contract.tenants && contract.tenants.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-300 mb-2">Kontakt</div>
                    <div className="space-y-1">
                      {contract.tenants.slice(0, 2).map((tenant) => (
                        <div key={tenant.id} className="text-sm text-gray-400">
                          {tenant.email && (
                            <div className="truncate">{tenant.email}</div>
                          )}
                          {tenant.phone && (
                            <div>{tenant.phone}</div>
                          )}
                        </div>
                      ))}
                      {contract.tenants.length > 2 && (
                        <div className="text-xs text-gray-300">
                          +{contract.tenants.length - 2} weitere
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showContractModal && (
        <RentalContractModal
          contract={selectedContract}
          properties={properties}
          onClose={() => {
            setShowContractModal(false);
            setSelectedContract(null);
          }}
          onSave={() => {
            setShowContractModal(false);
            setSelectedContract(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
