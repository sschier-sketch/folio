import InterestRateChart from "./InterestRateChart";
import InterestRateTable from "./InterestRateTable";
import { useInterestRates } from "../../hooks/useInterestRates";
import { RefreshCw, AlertCircle } from "lucide-react";

function BauzinsenWidget() {
  const { data, loading, error, range, changeRange } = useInterestRates("5y");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (error === "not_found") {
    return (
      <div className="my-8 flex items-start gap-3 p-5 bg-amber-50 border border-amber-100 rounded-xl">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Zinsdaten aktuell nicht verfuegbar</p>
          <p className="text-sm text-amber-700 mt-1">
            Der woechentliche Datenimport von der Bundesbank wurde noch nicht ausgefuehrt.
            Die Daten werden automatisch nachgeladen, sobald sie verfuegbar sind.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8 flex items-start gap-3 p-5 bg-red-50 border border-red-100 rounded-xl">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">Fehler beim Laden der Zinsdaten: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <InterestRateChart
        series={data.series.series}
        endPeriod={data.end_period}
        fetchedAt={data.fetched_at}
        range={range}
        onRangeChange={changeRange}
      />
      <InterestRateTable series={data.series.series} />
    </>
  );
}

export const ARTICLE_COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  bauzinsen: BauzinsenWidget,
};
