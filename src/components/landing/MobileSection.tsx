import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { Smartphone, Wifi, Zap, Home, Bell, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PERKS: { icon: LucideIcon; text: string }[] = [
  { icon: Smartphone, text: "Optimiert für alle Bildschirmgrößen" },
  { icon: Wifi, text: "Überall online verfügbar" },
  { icon: Zap, text: "Schnell und reaktionsfreudig" },
];

function MobileMockup() {
  return (
    <div className="w-[260px] rounded-[36px] border-[6px] border-gray-900 bg-white overflow-hidden shadow-xl shadow-gray-900/[0.12]">
      <div className="h-7 bg-gray-900 flex justify-center">
        <div className="w-20 h-5 bg-gray-800 rounded-b-xl" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-20 bg-gray-100 rounded" />
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
          >
            <Bell className="w-3.5 h-3.5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {["#3c8af7", "#22c55e"].map((color) => (
            <div key={color} className="h-14 rounded-lg border border-gray-100 p-2.5 flex flex-col justify-between">
              <div className="h-2 w-10 bg-gray-100 rounded" />
              <div className="h-3.5 w-16 rounded" style={{ backgroundColor: color + "18" }} />
            </div>
          ))}
        </div>
        <div className="h-20 rounded-lg border border-gray-100 p-2.5 mb-3">
          <div className="h-2 w-16 bg-gray-100 rounded mb-2" />
          <div className="flex items-end gap-1.5 h-10">
            {[35, 55, 45, 70, 50, 65, 80].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  backgroundColor: i === 6 ? "#3c8af7" : "#3c8af7" + "30",
                }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[Home, FileText].map((Icon, i) => (
            <div key={i} className="h-10 rounded border border-gray-100 flex items-center px-2.5 gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
              >
                <Icon className="w-3 h-3" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
              </div>
              <div className="h-2 flex-1 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MobileSection() {
  const navigate = useNavigate();

  return (
    <section className="py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4 max-w-[700px]">
              Ihre Verwaltung, immer dabei
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8 max-w-[650px]">
              Greifen Sie von jedem Gerät auf Ihre Immobiliendaten zu
              — ob am Desktop oder unterwegs auf dem Smartphone.
            </p>
            <ul className="space-y-3 mb-8">
              {PERKS.map((perk) => (
                <li key={perk.text} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#EEF4FF", border: "1px solid #DDE7FF" }}
                  >
                    <perk.icon className="w-5 h-5" style={{ color: "#1E1E24" }} strokeWidth={1.5} />
                  </div>
                  <span className="text-gray-700 text-sm">{perk.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(withRef("/signup"))}
              className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
            >
              Kostenlos starten
            </button>
          </div>

          <div className="hidden lg:flex justify-center">
            <MobileMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
