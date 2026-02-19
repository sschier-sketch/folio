import {
  FileText,
  Calculator,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Home,
  BarChart3,
  Users,
  Receipt,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

function BillingMockup() {
  const lineItems = [
    { label: 'Grundsteuer', amount: '312,00', key: 'Wohnfläche' },
    { label: 'Gebäudeversicherung', amount: '489,60', key: 'Wohnfläche' },
    { label: 'Wasser / Abwasser', amount: '276,48', key: 'Verbrauch' },
    { label: 'Müllabfuhr', amount: '198,00', key: 'Personen' },
    { label: 'Heizkosten', amount: '847,20', key: 'Verbrauch' },
    { label: 'Hausreinigung', amount: '156,00', key: 'Wohnfläche' },
  ];

  return (
    <div className="bg-white rounded-[20px] shadow-2xl shadow-black/10 overflow-hidden border border-gray-100">
      <div className="h-12 bg-gray-50 border-b border-gray-100 flex items-center gap-2 px-5">
        <span className="w-3 h-3 rounded-full bg-[#ef4444]/50" />
        <span className="w-3 h-3 rounded-full bg-[#f59e0b]/50" />
        <span className="w-3 h-3 rounded-full bg-[#22c55e]/50" />
        <div className="ml-4 h-6 w-56 bg-gray-100 rounded-md" />
      </div>
      <div className="flex">
        <div className="w-16 bg-gray-50 border-r border-gray-100 py-5 flex flex-col items-center gap-5">
          {[Home, Users, Receipt, BarChart3, FileText].map((Icon, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: i === 2 ? '#3c8af7' : 'transparent',
              }}
            >
              <Icon
                className="w-[18px] h-[18px]"
                style={{ color: i === 2 ? '#fff' : '#9ca3af' }}
                strokeWidth={1.5}
              />
            </div>
          ))}
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[15px] font-bold text-gray-900">Nebenkostenabrechnung 2025</div>
              <div className="text-[12px] text-gray-400 mt-0.5">Musterstraße 12, Whg. 3</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
              <span className="text-[11px] font-semibold text-[#22c55e]">Fertig</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Gesamtkosten', value: '2.279,28 €', color: '#3c8af7' },
              { label: 'Mieteranteil', value: '1.847,52 €', color: '#f59e0b' },
              { label: 'Guthaben', value: '152,48 €', color: '#22c55e' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 p-3">
                <div className="text-[10px] text-gray-400 mb-1">{stat.label}</div>
                <div className="text-[14px] font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-0">
            <div className="flex items-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pb-2 border-b border-gray-100">
              <span className="flex-1">Kostenart</span>
              <span className="w-20 text-right">Betrag</span>
              <span className="w-20 text-right">Schlüssel</span>
            </div>
            {lineItems.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center text-[12px] px-3 py-2.5"
                style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'transparent' }}
              >
                <span className="flex-1 text-gray-700 font-medium">{item.label}</span>
                <span className="w-20 text-right text-gray-900 font-semibold">{item.amount} €</span>
                <span className="w-20 text-right text-gray-400">{item.key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NebenkostenAd() {
  return (
    <div
      style={{ width: 1080, height: 1350, fontFamily: 'Manrope, system-ui, sans-serif' }}
      className="relative bg-[#131719] overflow-hidden flex flex-col"
    >
      <div className="absolute inset-0">
        <div
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-[0.07]"
          style={{
            background: 'radial-gradient(circle, #3c8af7 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, #3c8af7 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #3c8af7 1px, transparent 0)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full px-14 pt-14 pb-12">
        <div className="flex items-center gap-4 mb-10">
          <img src="/rentably-logo-new.svg" alt="Rentably" className="h-10" />
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#3c8af7]/10 border border-[#3c8af7]/20">
            <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
            <span className="text-[17px] font-semibold text-[#f59e0b]">
              Nebenkosten-Chaos?
            </span>
          </div>
        </div>

        <h1 className="text-[62px] font-extrabold text-white leading-[1.05] tracking-tight mb-6">
          Nebenkosten{'\n'}
          <span className="text-[#3c8af7]">automatisch</span>
          <br />
          abrechnen.
        </h1>

        <p className="text-[22px] text-gray-400 leading-relaxed max-w-[680px] mb-10">
          Erstelle rechtssichere Nebenkostenabrechnungen in Minuten statt Stunden.
          Rentably berechnet, verteilt und erstellt alles automatisch.
        </p>

        <div className="flex-1 flex items-start">
          <div className="w-full max-w-[680px]">
            <BillingMockup />
          </div>
        </div>

        <div className="mt-auto pt-8">
          <div className="grid grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: Calculator,
                title: 'Automatisch berechnen',
                desc: 'Alle Umlageschlüssel hinterlegt',
              },
              {
                icon: Clock,
                title: 'In Minuten fertig',
                desc: 'Statt stundenlanger Handarbeit',
              },
              {
                icon: ShieldCheck,
                title: 'Rechtssicher',
                desc: 'Nach aktueller Gesetzgebung',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#3c8af7]/10 border border-[#3c8af7]/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#3c8af7]" />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-white">{item.title}</div>
                  <div className="text-[14px] text-gray-500 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="h-16 px-10 rounded-xl bg-[#3c8af7] hover:bg-[#3579de] transition-colors flex items-center gap-3">
                <span className="text-[20px] font-bold text-white">Jetzt kostenlos testen</span>
                <ArrowRight className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <img src="/dsvgo.png" alt="DSGVO" className="h-10 opacity-60" />
              </div>
              <div className="flex items-center gap-2">
                <img src="/entwickelt-in-deutschland.png" alt="Made in Germany" className="h-10 opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
