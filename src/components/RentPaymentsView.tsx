import { useState, useEffect } from 'react';
import { Check, X, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RentPayment {
  id: string;
  due_date: string;
  amount: number;
  paid: boolean;
  paid_date: string | null;
  notes: string;
  property: {
    name: string;
    address: string;
  } | null;
  rental_contract: {
    tenants: Array<{
      first_name: string;
      last_name: string;
    }>;
  } | null;
}

export default function RentPaymentsView() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterContract, setFilterContract] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('unpaid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (properties.length > 0 && contracts.length > 0) {
      loadPayments();
    }
  }, [filterProperty, filterContract, filterStatus, startDate, endDate]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [propertiesRes, contractsRes] = await Promise.all([
        supabase.from('properties').select('id, name').eq('user_id', user.id),
        supabase
          .from('rental_contracts')
          .select(`
            id,
            property_id,
            properties(name),
            tenants(first_name, last_name)
          `)
          .eq('user_id', user.id)
          .order('contract_start', { ascending: false }),
      ]);

      setProperties(propertiesRes.data || []);
      setContracts(contractsRes.data || []);

      await loadPayments();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('rent_payments')
        .select(`
          *,
          property:properties(name, address),
          rental_contract:rental_contracts(
            tenants(first_name, last_name)
          )
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (filterProperty !== 'all') {
        query = query.eq('property_id', filterProperty);
      }

      if (filterContract !== 'all') {
        query = query.eq('contract_id', filterContract);
      }

      if (filterStatus === 'paid') {
        query = query.eq('paid', true);
      } else if (filterStatus === 'unpaid') {
        query = query.eq('paid', false);
        if (!endDate) {
          const today = new Date().toISOString().split('T')[0];
          query = query.lte('due_date', today);
        }
      }

      if (startDate) {
        query = query.gte('due_date', startDate);
      }

      if (endDate) {
        query = query.lte('due_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('rent_payments')
        .update({ paid: true, paid_date: new Date().toISOString().split('T')[0] })
        .eq('id', paymentId);

      if (error) throw error;
      loadPayments();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      alert('Fehler beim Markieren der Zahlung');
    }
  };

  const handleMarkAsUnpaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('rent_payments')
        .update({ paid: false, paid_date: null })
        .eq('id', paymentId);

      if (error) throw error;
      loadPayments();
    } catch (error) {
      console.error('Error marking payment as unpaid:', error);
      alert('Fehler beim Markieren der Zahlung');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalUnpaid = payments
    .filter(p => !p.paid)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPaid = payments
    .filter(p => p.paid)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Lade Mieteingänge...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark mb-2">Mieteingänge</h2>
        <p className="text-gray-400">Verwalten Sie ausstehende und bezahlte Mieten</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-300 mb-1">Ausstehend</div>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalUnpaid)}</div>
        </div>
        <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-300 mb-1">Bezahlt</div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-300 mb-1">Gesamt</div>
          <div className="text-2xl font-bold text-dark">{formatCurrency(totalUnpaid + totalPaid)}</div>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-dark">Filter</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Immobilie
            </label>
            <select
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              <option value="all">Alle</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Mietvertrag
            </label>
            <select
              value={filterContract}
              onChange={(e) => setFilterContract(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              <option value="all">Alle</option>
              {contracts.map((contract: any) => (
                <option key={contract.id} value={contract.id}>
                  {contract.properties?.name} - {contract.tenants?.map((t: any) => `${t.first_name} ${t.last_name}`).join(', ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'paid' | 'unpaid')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              <option value="all">Alle</option>
              <option value="unpaid">Ausstehend</option>
              <option value="paid">Bezahlt</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Von
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Bis
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-300">
            Keine Mieteingänge gefunden. Mieteingänge werden automatisch generiert, wenn Sie Mietverträge anlegen.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Fälligkeitsdatum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Immobilie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Mieter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                      {formatDate(payment.due_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark">
                      {payment.property ? (
                        <>
                          <div className="font-medium">{payment.property.name}</div>
                          <div className="text-xs text-gray-300">{payment.property.address}</div>
                        </>
                      ) : (
                        <span className="text-gray-300 italic">Keine Immobilie</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark">
                      {payment.rental_contract?.tenants && payment.rental_contract.tenants.length > 0 ? (
                        <div className="space-y-1">
                          {payment.rental_contract.tenants.map((tenant, idx) => (
                            <div key={idx}>
                              {tenant.first_name} {tenant.last_name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 italic">Kein Mieter</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.paid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" />
                          Bezahlt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <X className="w-3 h-3" />
                          Ausstehend
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payment.paid ? (
                        <button
                          onClick={() => handleMarkAsUnpaid(payment.id)}
                          className="text-orange-600 hover:text-orange-800 font-medium transition-colors"
                        >
                          Als unbezahlt markieren
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsPaid(payment.id)}
                          className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                        >
                          Als bezahlt markieren
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
