import { useState, useEffect } from "react";
import { api, StockDetail, ChartCandle, ChartPeriod } from "../services/api";

export function useStockDetail(symbol: string) {
  const [data, setData] = useState<StockDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    api
      .getStockDetail(symbol)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setIsLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return { data, isLoading, error };
}

export function useChart(symbol: string, period: ChartPeriod = "3m") {
  const [data, setData] = useState<ChartCandle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    api
      .getChart(symbol, period)
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setIsLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, period]);

  return { data, isLoading, error };
}
