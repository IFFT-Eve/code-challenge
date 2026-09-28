import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Token } from "./usePrices";
import { TokenIcon } from "./TokenIcon";
import { formatAmount, formatUsd } from "./format";

interface Props {
  open: boolean;
  tokens: Token[];
  balances: Record<string, number>;
  selected?: string;
  disabledSymbol?: string;
  onSelect: (symbol: string) => void;
  onClose: () => void;
}

export function TokenSelect({ open, tokens, balances, selected, disabledSymbol, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? tokens.filter((t) => t.symbol.toLowerCase().includes(q)) : tokens;
    // Tokens the user holds float to the top, then alphabetical.
    return [...list].sort((a, b) => {
      const va = (balances[a.symbol] ?? 0) * a.price;
      const vb = (balances[b.symbol] ?? 0) * b.price;
      if (vb !== va) return vb - va;
      return a.symbol.localeCompare(b.symbol);
    });
  }, [tokens, query, balances]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  // Picking the token from the other side is allowed: the parent flips the pair.
  const choose = (t: Token | undefined) => {
    if (t) onSelect(t.symbol);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(filtered[active]);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Select a token"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="modal__header">
          <h2>Select a token</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal__search">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path
              fill="currentColor"
              d="M10 4a6 6 0 1 0 3.87 10.59l4.77 4.77 1.41-1.41-4.77-4.77A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
            />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symbol"
            aria-label="Search tokens"
            spellCheck={false}
          />
        </div>
        {filtered.length === 0 ? (
          <p className="modal__empty">No tokens match “{query}”.</p>
        ) : (
          <ul className="token-list" ref={listRef} role="listbox">
            {filtered.map((t, i) => {
              const bal = balances[t.symbol] ?? 0;
              const isOther = t.symbol === disabledSymbol;
              return (
                <li
                  key={t.symbol}
                  role="option"
                  aria-selected={t.symbol === selected}
                  className={[
                    "token-row",
                    i === active && "is-active",
                    t.symbol === selected && "is-selected",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(t)}
                >
                  <TokenIcon symbol={t.symbol} size={32} />
                  <div className="token-row__main">
                    <span className="token-row__symbol">{t.symbol}</span>
                    <span className="token-row__price">{formatUsd(t.price)}</span>
                  </div>
                  <div className="token-row__bal">
                    {bal > 0 ? (
                      <>
                        <span>{formatAmount(bal)}</span>
                        <span className="muted">{formatUsd(bal * t.price)}</span>
                      </>
                    ) : isOther ? (
                      <span className="muted">Flip pair</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
