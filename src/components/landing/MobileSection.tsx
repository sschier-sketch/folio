import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";

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
              Responsive und schnell.
            </p>
            <button
              onClick={() => navigate(withRef("/signup"))}
              className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
            >
              Kostenlos starten
            </button>
          </div>

          <div className="hidden lg:flex justify-center">
            <div className="w-[260px] rounded-[36px] border-[6px] border-gray-900 bg-white overflow-hidden shadow-xl shadow-gray-900/[0.12]">
              <div className="h-7 bg-gray-900 flex justify-center">
                <div className="w-20 h-5 bg-gray-800 rounded-b-xl" />
              </div>
              <div className="p-4 space-y-3 min-h-[400px]">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                  <div className="w-6 h-6 rounded-full bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                      <div className="h-2 w-10 bg-gray-200 rounded" />
                      <div className="h-4 w-8 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="w-5 h-5 rounded bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2 bg-gray-100 rounded w-4/5" />
                        <div className="h-1.5 bg-gray-50 rounded w-3/5" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-8 w-full bg-[#3c8af7]/10 rounded-lg mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
