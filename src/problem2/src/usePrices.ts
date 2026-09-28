import { useCallback, useEffect, useState } from "react";
import { PRICES_URL } from "./constants";

export interface Token {
  symbol: string;
  price: number;
}

interface RawPrice {
  currency: string;
  date: string;
  price: number;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; tokens: Token[] };

/** The feed lists some currencies more than once; keep the most recent valid price. */
function normalize(raw: RawPrice[]): Token[] {
  const latest = new Map<string, RawPrice>();
  for (const entry of raw) {
    if (!entry.currency || !(typeof entry.price === "number") || !(entry.price > 0)) continue;
    const prev = latest.get(entry.currency);
    if (!prev || Date.parse(entry.date) > Date.parse(prev.date)) {
      latest.set(entry.currency, entry);
    }
  }
  return [...latest.values()]
    .map((e) => ({ symbol: e.currency, price: e.price }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function usePrices() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: "loading" });
    fetch(PRICES_URL, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Price feed responded with ${res.status}`);
        return res.json() as Promise<RawPrice[]>;
      })
      .then((data) => {
        const tokens = normalize(Array.isArray(data) ? data : []);
        if (tokens.length === 0) throw new Error("No priced tokens available");
        setState({ status: "ready", tokens });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load prices",
        });
      });
    return () => ctrl.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
