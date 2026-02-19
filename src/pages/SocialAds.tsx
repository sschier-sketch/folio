import { useState } from 'react';
import { NebenkostenAd } from '../components/social-ads/NebenkostenAd';

const ADS = [
  { id: 'nebenkosten', label: 'Nebenkosten', component: NebenkostenAd },
];

export default function SocialAds() {
  const [activeAd, setActiveAd] = useState(ADS[0].id);
  const ActiveComponent = ADS.find((a) => a.id === activeAd)?.component ?? ADS[0].component;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Social Ads Preview</h1>
        <p className="text-gray-500 mb-8">1080 x 1350 -- Rechtsklick auf die Ad und "Bild speichern" oder Screenshot machen.</p>

        <div className="flex gap-3 mb-8">
          {ADS.map((ad) => (
            <button
              key={ad.id}
              onClick={() => setActiveAd(ad.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeAd === ad.id
                  ? 'bg-[#3c8af7] text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {ad.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <div
            style={{ width: 1080, height: 1350, transform: 'scale(0.55)', transformOrigin: 'top center' }}
          >
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
