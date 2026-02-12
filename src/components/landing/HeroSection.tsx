import { useNavigate } from "react-router-dom";
import { withRef } from "../../lib/referralTracking";
import { RefLink } from "../common/RefLink";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-16 sm:pt-24 pb-[100px] sm:pb-[120px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight">
              Immobilienverwaltung,{" "}
              <span className="text-[#3c8af7]">die mitdenkt.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-[20px] text-gray-500 leading-relaxed max-w-[540px]">
              Objekte, Mieter, Finanzen und Dokumente an einem Ort.
              Die Software für private Vermieter, die Ordnung schaffen
              und Zeit sparen wollen.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <button
                onClick={() => navigate(withRef("/signup"))}
                className="h-12 px-8 rounded-lg text-base font-semibold bg-[#3c8af7] text-white hover:bg-[#3579de] transition-colors"
              >
                Kostenlos starten
              </button>
              <RefLink
                to="/preise"
                className="h-12 inline-flex items-center px-8 rounded-lg text-base font-semibold border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
              >
                Preise ansehen
              </RefLink>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/[0.08] overflow-hidden">
              <div className="h-9 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 px-4">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <div className="ml-4 h-5 w-48 bg-gray-100 rounded-md" />
              </div>
              <div className="flex">
                <div className="w-40 border-r border-gray-100 p-4 space-y-3 hidden xl:block">
                  <div className="h-5 w-16 bg-[#3c8af7]/10 rounded" />
                  <div className="space-y-2.5 pt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-3.5 rounded ${i === 1 ? "w-24 bg-[#3c8af7]/15" : "w-20 bg-gray-100"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-7 w-20 bg-[#3c8af7]/10 rounded-md" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3.5 space-y-1.5">
                        <div className="h-2 w-14 bg-gray-200 rounded" />
                        <div className="h-5 w-10 bg-gray-100 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                      >
                        <div className="w-7 h-7 rounded bg-gray-100 flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2.5 bg-gray-100 rounded w-3/5" />
                          <div className="h-2 bg-gray-50 rounded w-2/5" />
                        </div>
                        <div className="h-4 w-12 bg-gray-50 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
