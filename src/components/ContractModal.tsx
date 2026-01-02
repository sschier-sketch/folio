import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { parseNumberInput } from '../lib/utils';

interface Tenant {
  id: string;
  property_id: string;
  first_name: string;
  last_name: string;
}

interface Contract {
  id: string;
  base_rent: number;
  additional_costs: number;
  total_rent: number;
  deposit: number;
  contract_start: string;
  contract_end: string | null;
  contract_type: string;
  document_url: string | null;
  document_path: string | null;
  rent_increase_type: string;
  staffel_amount: number;
  staffel_type: string;
  staffel_years: number;
  index_first_increase_date: string | null;
  notes: string;
}

interface ContractModalProps {
  tenant: Tenant;
  contract: Contract | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ContractModal({ tenant, contract, onClose, onSave }: ContractModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    base_rent: 0,
    additional_costs: 0,
    deposit: 0,
    contract_start: '',
    contract_end: '',
    contract_type: 'unlimited',
    document_path: '',
    rent_increase_type: 'none',
    staffel_amount: 0,
    staffel_type: 'percentage',
    staffel_years: 0,
    index_first_increase_date: '',
    notes: '',
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        base_rent: contract.base_rent,
        additional_costs: contract.additional_costs,
        deposit: contract.deposit,
        contract_start: contract.contract_start,
        contract_end: contract.contract_end || '',
        contract_type: contract.contract_type,
        document_path: contract.document_path || '',
        rent_increase_type: contract.rent_increase_type || 'none',
        staffel_amount: contract.staffel_amount || 0,
        staffel_type: contract.staffel_type || 'percentage',
        staffel_years: contract.staffel_years || 0,
        index_first_increase_date: contract.index_first_increase_date || '',
        notes: contract.notes,
      });
    }
  }, [contract]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadDocument = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploadingFile(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      return fileName;
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fehler beim Hochladen des Dokuments');
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let documentPath = formData.document_path;

      if (selectedFile) {
        const uploadedPath = await uploadDocument();
        if (uploadedPath) {
          documentPath = uploadedPath;
        }
      }

      const totalRent = Number(formData.base_rent) + Number(formData.additional_costs);

      const data = {
        tenant_id: tenant.id,
        property_id: tenant.property_id,
        user_id: user.id,
        base_rent: Number(formData.base_rent),
        additional_costs: Number(formData.additional_costs),
        total_rent: totalRent,
        deposit: Number(formData.deposit),
        contract_start: formData.contract_start,
        contract_end: formData.contract_end || null,
        contract_type: formData.contract_type,
        document_path: documentPath || null,
        rent_increase_type: formData.rent_increase_type,
        staffel_amount: formData.rent_increase_type === 'staffel' ? Number(formData.staffel_amount) : 0,
        staffel_type: formData.rent_increase_type === 'staffel' ? formData.staffel_type : 'percentage',
        staffel_years: formData.rent_increase_type === 'staffel' ? Number(formData.staffel_years) : 0,
        index_first_increase_date: formData.rent_increase_type === 'index' ? formData.index_first_increase_date : null,
        notes: formData.notes,
      };

      if (contract) {
        const { error } = await supabase
          .from('rental_contracts')
          .update(data)
          .eq('id', contract.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('rental_contracts').insert([data]);
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('Fehler beim Speichern des Mietvertrags');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dark">
            {contract ? 'Mietvertrag bearbeiten' : 'Neuer Mietvertrag'}
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Mieter</div>
            <div className="font-semibold text-dark">
              {tenant.first_name} {tenant.last_name}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-dark text-lg">Miete</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Kaltmiete (€) *
                </label>
                <input
                  type="text"
                  value={formData.base_rent}
                  onChange={(e) => setFormData({ ...formData, base_rent: parseNumberInput(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. 850 oder 850,50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nebenkosten (€)
                </label>
                <input
                  type="text"
                  value={formData.additional_costs}
                  onChange={(e) => setFormData({ ...formData, additional_costs: parseNumberInput(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. 150 oder 150,75"
                />
              </div>

              <div className="col-span-2">
                <div className="bg-primary-blue/5 rounded-lg p-4">
                  <div className="text-sm text-primary-blue mb-1">Warmmiete (gesamt)</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {(Number(formData.base_rent) + Number(formData.additional_costs)).toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Kaution (€)
                </label>
                <input
                  type="text"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: parseNumberInput(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. 2550 oder 2550,00"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-dark text-lg">Mieterhöhung</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Art der Mieterhöhung
                </label>
                <select
                  value={formData.rent_increase_type}
                  onChange={(e) => setFormData({ ...formData, rent_increase_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="none">Keine</option>
                  <option value="staffel">Staffelmiete</option>
                  <option value="index">Indexmiete</option>
                </select>
              </div>

              {formData.rent_increase_type === 'staffel' && (
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Erhöhung pro Jahr
                    </label>
                    <input
                      type="text"
                      value={formData.staffel_amount}
                      onChange={(e) => setFormData({ ...formData, staffel_amount: parseNumberInput(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="z.B. 2,5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Typ
                    </label>
                    <select
                      value={formData.staffel_type}
                      onChange={(e) => setFormData({ ...formData, staffel_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="percentage">Prozent (%)</option>
                      <option value="fixed">Fester Betrag (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Anzahl Jahre
                    </label>
                    <input
                      type="text"
                      value={formData.staffel_years}
                      onChange={(e) => setFormData({ ...formData, staffel_years: parseNumberInput(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="z.B. 5"
                    />
                  </div>
                </div>
              )}

              {formData.rent_increase_type === 'index' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Erster Erhöhungszeitpunkt
                  </label>
                  <input
                    type="date"
                    value={formData.index_first_increase_date}
                    onChange={(e) => setFormData({ ...formData, index_first_increase_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-dark text-lg">Vertragsdaten</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Vertragsbeginn *
                </label>
                <input
                  type="date"
                  value={formData.contract_start}
                  onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Vertragsende
                </label>
                <input
                  type="date"
                  value={formData.contract_end}
                  onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Vertragsart
                </label>
                <select
                  value={formData.contract_type}
                  onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="unlimited">Unbefristet</option>
                  <option value="fixed">Befristet</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Mietvertrag (Dokument)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 transition-colors">
                      <Upload className="w-5 h-5 text-gray-300" />
                      <span className="text-sm text-gray-400">
                        {selectedFile ? selectedFile.name : formData.document_path ? 'Dokument vorhanden' : 'Datei auswählen'}
                      </span>
                    </div>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-300">
                  PDF, Word oder Bild (max. 10MB)
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Notizen
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-400 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || uploadingFile}
              className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors disabled:opacity-50"
            >
              {loading ? 'Speichern...' : uploadingFile ? 'Hochladen...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
