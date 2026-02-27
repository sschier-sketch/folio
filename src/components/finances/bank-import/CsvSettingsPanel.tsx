import { ChevronDown } from 'lucide-react';

export interface CsvSettings {
  delimiter: string;
  decimalSeparator: ',' | '.';
  dateFormat: string;
  skipRows: number;
  encoding: string;
}

interface CsvSettingsPanelProps {
  settings: CsvSettings;
  onChange: (settings: CsvSettings) => void;
}

export const DEFAULT_CSV_SETTINGS: CsvSettings = {
  delimiter: ';',
  decimalSeparator: ',',
  dateFormat: 'auto',
  skipRows: 0,
  encoding: 'utf-8',
};

export default function CsvSettingsPanel({
  settings,
  onChange,
}: CsvSettingsPanelProps) {
  const update = (partial: Partial<CsvSettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 mb-2">
        CSV Einstellungen
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Trennzeichen
          </label>
          <div className="relative">
            <select
              value={settings.delimiter}
              onChange={(e) => update({ delimiter: e.target.value })}
              className="w-full h-9 pl-3 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
            >
              <option value=";">Semikolon ( ; )</option>
              <option value=",">Komma ( , )</option>
              <option value="\t">Tab</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Dezimalzeichen
          </label>
          <div className="relative">
            <select
              value={settings.decimalSeparator}
              onChange={(e) =>
                update({ decimalSeparator: e.target.value as ',' | '.' })
              }
              className="w-full h-9 pl-3 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
            >
              <option value=",">Komma ( , )</option>
              <option value=".">Punkt ( . )</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Datumsformat
          </label>
          <div className="relative">
            <select
              value={settings.dateFormat}
              onChange={(e) => update({ dateFormat: e.target.value })}
              className="w-full h-9 pl-3 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
            >
              <option value="auto">Auto-Erkennung</option>
              <option value="DD.MM.YYYY">TT.MM.JJJJ</option>
              <option value="YYYY-MM-DD">JJJJ-MM-TT</option>
              <option value="MM/DD/YYYY">MM/TT/JJJJ</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Kopfzeilen ueberspringen
          </label>
          <input
            type="number"
            min={0}
            max={20}
            value={settings.skipRows}
            onChange={(e) =>
              update({ skipRows: Math.max(0, parseInt(e.target.value) || 0) })
            }
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Zeichenkodierung
          </label>
          <div className="relative">
            <select
              value={settings.encoding}
              onChange={(e) => update({ encoding: e.target.value })}
              className="w-full h-9 pl-3 pr-8 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#3c8af7]/30 focus:border-[#3c8af7]"
            >
              <option value="utf-8">UTF-8</option>
              <option value="iso-8859-1">ISO-8859-1 (Latin)</option>
              <option value="windows-1252">Windows-1252</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
