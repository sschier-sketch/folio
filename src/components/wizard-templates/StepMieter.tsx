import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { TenantEntry } from './types';

interface Props {
  tenants: TenantEntry[];
  onChange: (tenants: TenantEntry[]) => void;
}

interface PropertyOption {
  id: string;
  name: string;
  address: string;
}

interface UnitOption {
  id: string;
  unit_number: string;
  property_id: string;
}

interface TenantOption {
  id: string;
  first_name: string;
  last_name: string;
  street: string | null;
  house_number: string | null;
  zip_code: string | null;
  city: string | null;
  country: string | null;
  property_id: string;
  unit_id: string | null;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

export default function StepMieter({ tenants, onChange }: Props) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [dbTenants, setDbTenants] = useState<TenantOption[]>([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    const [propRes, unitRes, tenantRes] = await Promise.all([
      supabase
        .from('properties')
        .select('id, name, address')
        .eq('user_id', user!.id)
        .order('name'),
      supabase
        .from('property_units')
        .select('id, unit_number, property_id')
        .eq('user_id', user!.id)
        .order('unit_number'),
      supabase
        .from('tenants')
        .select('id, first_name, last_name, street, house_number, zip_code, city, country, property_id, unit_id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('last_name'),
    ]);
    if (propRes.data) setProperties(propRes.data);
    if (unitRes.data) setUnits(unitRes.data);
    if (tenantRes.data) setDbTenants(tenantRes.data);
  }

  function updateTenant(index: number, partial: Partial<TenantEntry>) {
    const updated = [...tenants];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  }


  function selectProperty(index: number, propId: string) {
    const prop = properties.find((p) => p.id === propId);
    updateTenant(index, {
      propertyId: propId,
      unitId: undefined,
      tenantId: undefined,
      propertyName: prop?.name || prop?.address || '',
      unitNumber: '',
      firstName: '',
      lastName: '',
      street: '',
      number: '',
      zip: '',
      city: '',
    });
  }

  function selectUnit(index: number, unitId: string) {
    const unit = units.find((u) => u.id === unitId);
    const matching = dbTenants.filter((t) => t.unit_id === unitId);
    if (matching.length === 1) {
      fillFromDbTenant(index, matching[0], unit?.unit_number);
    } else {
      updateTenant(index, {
        unitId,
        unitNumber: unit?.unit_number || '',
        tenantId: undefined,
      });
    }
  }

  function selectTenant(index: number, tenantId: string) {
    const t = dbTenants.find((x) => x.id === tenantId);
    if (!t) return;
    const unit = units.find((u) => u.id === (t.unit_id || ''));
    fillFromDbTenant(index, t, unit?.unit_number);
  }

  function fillFromDbTenant(index: number, t: TenantOption, unitNumber?: string) {
    const prop = properties.find((p) => p.id === t.property_id);
    updateTenant(index, {
      tenantId: t.id,
      propertyId: t.property_id,
      unitId: t.unit_id || undefined,
      propertyName: prop?.name || prop?.address || '',
      unitNumber: unitNumber || '',
      firstName: t.first_name,
      lastName: t.last_name,
      street: t.street || '',
      number: t.house_number || '',
      zip: t.zip_code || '',
      city: t.city || '',
      country: t.country || 'Deutschland',
    });
  }

  return (
    <div>
      <div className="bg-blue-50 rounded-lg px-5 py-4 mb-6">
        <h4 className="font-semibold text-dark mb-1 text-sm">Hinweise & Tipps</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Wählen Sie zunächst das Objekt und die Einheit. Die Mieterdaten werden automatisch
          aus Ihrem System geladen, können aber manuell angepasst werden.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Mieter</h3>
      <p className="text-sm text-gray-500 mb-8">
        Wählen Sie Objekt, Einheit und Mieter aus Ihren Daten oder füllen Sie die Felder manuell aus.
      </p>

      {tenants.map((tenant, idx) => {
        const propUnits = units.filter((u) => u.property_id === tenant.propertyId);
        const propTenants = dbTenants.filter(
          (t) =>
            t.property_id === tenant.propertyId &&
            (!tenant.unitId || t.unit_id === tenant.unitId),
        );

        return (
          <div key={idx} className="mb-6 p-6 bg-gray-50 rounded-lg relative">
            <h4 className="text-lg font-semibold text-dark mb-4">
              Empfänger
            </h4>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Objekt
                  </label>
                  <select
                    value={tenant.propertyId || ''}
                    onChange={(e) => selectProperty(idx, e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Objekt auswählen...</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.address}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Einheit
                  </label>
                  <select
                    value={tenant.unitId || ''}
                    onChange={(e) => selectUnit(idx, e.target.value)}
                    className={inputCls}
                    disabled={!tenant.propertyId}
                  >
                    <option value="">Einheit auswählen...</option>
                    {propUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {tenant.propertyId && propTenants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mieter
                  </label>
                  <select
                    value={tenant.tenantId || ''}
                    onChange={(e) => selectTenant(idx, e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Mieter auswählen...</option>
                    {propTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={tenant.firstName}
                    onChange={(e) => updateTenant(idx, { firstName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={tenant.lastName}
                    onChange={(e) => updateTenant(idx, { lastName: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Straße *
                  </label>
                  <input
                    type="text"
                    value={tenant.street}
                    onChange={(e) => updateTenant(idx, { street: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nr. *
                  </label>
                  <input
                    type="text"
                    value={tenant.number}
                    onChange={(e) => updateTenant(idx, { number: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    value={tenant.zip}
                    onChange={(e) => updateTenant(idx, { zip: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stadt *
                  </label>
                  <input
                    type="text"
                    value={tenant.city}
                    onChange={(e) => updateTenant(idx, { city: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresszusatz
                </label>
                <input
                  type="text"
                  value={tenant.prefix}
                  onChange={(e) => updateTenant(idx, { prefix: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Land
                </label>
                <input
                  type="text"
                  value="Deutschland"
                  disabled
                  className={`${inputCls} bg-gray-50 text-gray-500`}
                />
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
}

export function isMieterValid(tenants: TenantEntry[]): boolean {
  if (tenants.length === 0) return false;
  return tenants.every(
    (t) =>
      t.firstName.trim() &&
      t.lastName.trim() &&
      t.street.trim() &&
      t.number.trim() &&
      t.zip.trim() &&
      t.city.trim(),
  );
}
