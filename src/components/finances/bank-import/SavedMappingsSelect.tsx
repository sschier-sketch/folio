import { useState, useEffect } from 'react';
import { Save, Trash2, ChevronDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';

interface SavedMapping {
  id: string;
  name: string;
  mapping: Record<string, string>;
  settings: Record<string, unknown>;
}

interface SavedMappingsSelectProps {
  userId: string;
  onSelect: (mapping: SavedMapping) => void;
  currentAssignments: Record<string, string>;
  currentSettings: Record<string, unknown>;
}

export default function SavedMappingsSelect({
  userId,
  onSelect,
  currentAssignments,
  currentSettings,
}: SavedMappingsSelectProps) {
  const [mappings, setMappings] = useState<SavedMapping[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMappings();
  }, [userId]);

  async function loadMappings() {
    const { data } = await supabase
      .from('csv_import_mappings')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (data) setMappings(data);
  }

  async function handleSave() {
    if (!saveName.trim()) return;
    setSaving(true);

    try {
      const hasValues = Object.values(currentAssignments).some(v => v);
      if (!hasValues) return;

      const { error } = await supabase.from('csv_import_mappings').insert({
        user_id: userId,
        name: saveName.trim(),
        mapping: currentAssignments,
        settings: currentSettings,
      });

      if (!error) {
        setSaveName('');
        setShowSaveInput(false);
        await loadMappings();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('csv_import_mappings').delete().eq('id', id);
    if (selectedId === id) setSelectedId('');
    await loadMappings();
  }

  function handleSelectChange(id: string) {
    setSelectedId(id);
    const found = mappings.find((m) => m.id === id);
    if (found) onSelect(found);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Gespeichertes Format
          </label>
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="w-full h-9 pl-3 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
            >
              <option value="">-- Neues Mapping --</option>
              {mappings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {selectedId && (
          <Button
            variant="text-danger"
            size="sm"
            onClick={() => handleDelete(selectedId)}
            title="Mapping loeschen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}

        {!showSaveInput ? (
          <Button
            variant="outlined"
            size="sm"
            onClick={() => setShowSaveInput(true)}
            title="Aktuelles Mapping speichern"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Speichern</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Name (z.B. Sparkasse)"
              className="h-[34px] px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7] w-40"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!saveName.trim() || saving}
            >
              {saving ? '...' : 'OK'}
            </Button>
            <Button
              variant="cancel"
              size="sm"
              onClick={() => {
                setShowSaveInput(false);
                setSaveName('');
              }}
            >
              X
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
