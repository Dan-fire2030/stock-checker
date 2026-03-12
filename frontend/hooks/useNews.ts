import { useState, useEffect } from "react";
import { api, NewsArticle, Market } from "../services/api";

export function useNews(market: Market = "all", limit = 30) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    api
      .getNews(market, limit)
      .then((res) => {
        if (!cancelled) {
          setArticles(res.articles);
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
  }, [market, limit, tick]);

  const refetch = () => setTick((t) => t + 1);

  return { articles, isLoading, error, refetch };
}

export function useStockNews(symbol: string) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getStockNews(symbol).then((res) => {
      if (!cancelled) {
        setArticles(res.articles);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [symbol]);

  return { articles, isLoading };
}
