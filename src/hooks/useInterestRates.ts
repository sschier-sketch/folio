import { useState, useEffect, useCallback } from "react";

export interface DataPoint {
  date: string;
  value: number;
}

export interface SeriesEntry {
  id: string;
  label: string;
  key: string;
  points: DataPoint[];
}

export interface InterestRateSnapshot {
  source: string;
  fetched_at: string;
  start_period: string;
  end_period: string;
  range: string;
  series: {
    meta: {
      source: string;
      flowRef: string;
      unit: string;
      note: string;
    };
    series: SeriesEntry[];
  };
}

type RangeKey = "1y" | "3y" | "5y" | "max";

export function useInterestRates(initialRange: RangeKey = "max") {
  const [data, setData] = useState<InterestRateSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>(initialRange);

  const fetchData = useCallback(async (r: RangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interest-rates?range=${r}`;
      const response = await fetch(apiUrl);
      if (response.status === 404) {
        setData(null);
        setError("not_found");
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      const json: InterestRateSnapshot = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const changeRange = useCallback((r: RangeKey) => {
    setRange(r);
  }, []);

  return { data, loading, error, range, changeRange };
}
