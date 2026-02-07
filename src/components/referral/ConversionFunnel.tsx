import { MousePointerClick, Users, CreditCard, ArrowRight } from 'lucide-react';

interface ConversionFunnelProps {
  clicks: number;
  signups: number;
  conversions: number;
}

export default function ConversionFunnel({ clicks, signups, conversions }: ConversionFunnelProps) {
  const clickToSignupRate = clicks > 0 ? (signups / clicks * 100) : 0;
  const signupToConversionRate = signups > 0 ? (conversions / signups * 100) : 0;
  const overallConversionRate = clicks > 0 ? (conversions / clicks * 100) : 0;

  const stages = [
    {
      icon: MousePointerClick,
      label: 'Clicks',
      value: clicks,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      width: 100,
    },
    {
      icon: Users,
      label: 'Signups',
      value: signups,
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      width: clicks > 0 ? (signups / clicks * 100) : 0,
      rate: clickToSignupRate,
    },
    {
      icon: CreditCard,
      label: 'Conversions',
      value: conversions,
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      width: clicks > 0 ? (conversions / clicks * 100) : 0,
      rate: signupToConversionRate,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-dark mb-6">Conversion-Funnel</h3>

      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.label}>
            <div className="flex items-center gap-4 mb-2">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full border ${stage.color} flex items-center justify-center`}>
                <stage.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  <span className="text-lg font-bold text-dark">{stage.value}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${stage.color.split(' ')[0]} transition-all duration-500`}
                    style={{ width: `${stage.width}%` }}
                  />
                </div>
              </div>
            </div>

            {index < stages.length - 1 && stage.rate !== undefined && (
              <div className="flex items-center gap-2 ml-14 mb-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{stage.rate.toFixed(1)}%</span> Conversion
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Gesamt Conversion Rate</span>
          <span className="text-xl font-bold text-primary-blue">{overallConversionRate.toFixed(2)}%</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Von Clicks zu zahlenden Kunden</p>
      </div>
    </div>
  );
}
