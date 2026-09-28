import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Token } from "./usePrices";
import { TokenIcon } from "./TokenIcon";
import { TokenSelect } from "./TokenSelect";
import { formatAmount, formatUsd, sanitizeAmount, toInputString } from "./format";
import { SWAP_DELAY_MS } from "./constants";

type Side = "from" | "to";

const SLIPPAGE = 0.005;

/** Pretend wallet: a few well-known tokens get a balance so validation has something to check. */
function mockBalances(tokens: Token[]): Record<string, number> {
  const holdings: Record<string, number> = { USDC: 2500, ETH: 1.2, ATOM: 180, SWTH: 250000, WBTC: 0.05, OSMO: 900 };
  const out: Record<string, number> = {};
  for (const t of tokens) if (holdings[t.symbol]) out[t.symbol] = holdings[t.symbol];
  // Guarantee at least one funded token even if the feed changes.
  if (Object.keys(out).length === 0 && tokens[0]) out[tokens[0].symbol] = 1000 / tokens[0].price;
  return out;
}

function pickDefault(tokens: Token[], preferred: string[], exclude?: string) {
  for (const s of preferred) if (s !== exclude && tokens.some((t) => t.symbol === s)) return s;
  return tokens.find((t) => t.symbol !== exclude)?.symbol ?? "";
}

interface Receipt {
  from: string;
  to: string;
  paid: number;
  received: number;
}

export function SwapForm({ tokens }: { tokens: Token[] }) {
  const priceOf = useMemo(() => new Map(tokens.map((t) => [t.symbol, t.price])), [tokens]);

  const [balances, setBalances] = useState(() => mockBalances(tokens));
  const [fromSym, setFromSym] = useState(() => pickDefault(tokens, ["USDC", "ETH"]));
  const [toSym, setToSym] = useState(() => pickDefault(tokens, ["ETH", "ATOM", "USDC"], fromSym));
  // Only the field the user typed in is stored; the other one is derived from prices.
  const [edited, setEdited] = useState<Side>("from");
  const [value, setValue] = useState("");
  const [picker, setPicker] = useState<Side | null>(null);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [invertRate, setInvertRate] = useState(false);

  const fromPrice = priceOf.get(fromSym) ?? 0;
  const toPrice = priceOf.get(toSym) ?? 0;
  const rate = fromPrice && toPrice ? fromPrice / toPrice : 0; // 1 FROM = rate TO

  const typed = parseFloat(value) || 0;
  const fromAmount = edited === "from" ? typed : rate ? typed / rate : 0;
  const toAmount = edited === "to" ? typed : typed * rate;

  const fromStr = edited === "from" ? value : toInputString(fromAmount);
  const toStr = edited === "to" ? value : toInputString(toAmount);

  const balance = balances[fromSym] ?? 0;

  // Validation — first failing rule drives both the inline message and the button label.
  let error: string | null = null;
  let cta = "Swap";
  if (!fromSym || !toSym) cta = "Select a token";
  else if (fromSym === toSym) {
    error = "Choose two different tokens.";
    cta = "Select different tokens";
  } else if (!(fromAmount > 0)) cta = "Enter an amount";
  // Small tolerance so MAX (which rounds to 6 significant digits) never trips this check.
  else if (fromAmount - balance > balance * 1e-5) {
    error = `Insufficient ${fromSym} balance. You have ${formatAmount(balance)} ${fromSym}.`;
    cta = `Insufficient ${fromSym} balance`;
  }
  const canSubmit = cta === "Swap" && !submitting;
  const showError = error && (touched || fromSym === toSym);

  useEffect(() => {
    if (!receipt) return;
    const id = setTimeout(() => setReceipt(null), 6000);
    return () => clearTimeout(id);
  }, [receipt]);

  const onAmount = (side: Side, raw: string) => {
    setEdited(side);
    setValue(sanitizeAmount(raw));
    setTouched(true);
  };

  // The typed amount travels with its token to the other side.
  const flip = () => {
    setFromSym(toSym);
    setToSym(fromSym);
    setEdited(edited === "from" ? "to" : "from");
  };

  const selectToken = (symbol: string) => {
    const side = picker;
    setPicker(null);
    if (!side) return;
    const other = side === "from" ? toSym : fromSym;
    if (symbol === other) {
      // Selecting the opposite token swaps the pair instead of erroring.
      flip();
      return;
    }
    if (side === "from") setFromSym(symbol);
    else setToSym(symbol);
  };

  const setMax = () => {
    setEdited("from");
    setValue(toInputString(balance));
    setTouched(true);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    const paid = Math.min(fromAmount, balance);
    const snapshot = { from: fromSym, to: toSym, paid, received: paid * rate };
    setTimeout(() => {
      setBalances((b) => ({
        ...b,
        [snapshot.from]: Math.max(0, (b[snapshot.from] ?? 0) - snapshot.paid),
        [snapshot.to]: (b[snapshot.to] ?? 0) + snapshot.received,
      }));
      setReceipt(snapshot);
      setSubmitting(false);
      setValue("");
      setTouched(false);
    }, SWAP_DELAY_MS);
  };

  const rateText = rate
    ? invertRate
      ? `1 ${toSym} ≈ ${formatAmount(1 / rate)} ${fromSym}`
      : `1 ${fromSym} ≈ ${formatAmount(rate)} ${toSym}`
    : "—";

  return (
    <>
      <form className="card swap" onSubmit={onSubmit} noValidate>
        <header className="swap__header">
          <h1>Swap</h1>
          <span className="pill">Slippage {SLIPPAGE * 100}%</span>
        </header>

        <AmountField
          id="input-amount"
          label="You pay"
          symbol={fromSym}
          value={fromStr}
          usd={fromAmount * fromPrice}
          invalid={Boolean(showError)}
          disabled={submitting}
          balance={balance}
          onMax={balance > 0 ? setMax : undefined}
          onChange={(v) => onAmount("from", v)}
          onPickToken={() => setPicker("from")}
        />

        <div className="flip-wrap">
          <button
            type="button"
            className="flip"
            onClick={flip}
            disabled={submitting}
            aria-label="Switch tokens"
            title="Switch tokens"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path fill="currentColor" d="M7 4 3 8h3v7h2V8h3L7 4Zm10 16 4-4h-3V9h-2v7h-3l4 4Z" />
            </svg>
          </button>
        </div>

        <AmountField
          id="output-amount"
          label="You receive"
          symbol={toSym}
          value={toStr}
          usd={toAmount * toPrice}
          disabled={submitting}
          balance={balances[toSym] ?? 0}
          onChange={(v) => onAmount("to", v)}
          onPickToken={() => setPicker("to")}
        />

        <p className={`field-error ${showError ? "is-visible" : ""}`} role="alert" aria-live="polite">
          {showError ? error : ""}
        </p>

        {rate > 0 && fromSym !== toSym && (
          <dl className="details">
            <div>
              <dt>Rate</dt>
              <dd>
                <button type="button" className="link" onClick={() => setInvertRate((v) => !v)} title="Invert rate">
                  {rateText} ⇄
                </button>
              </dd>
            </div>
            {toAmount > 0 && (
              <div>
                <dt>Minimum received</dt>
                <dd>
                  {formatAmount(toAmount * (1 - SLIPPAGE))} {toSym}
                </dd>
              </div>
            )}
          </dl>
        )}

        <button type="submit" className="btn btn--primary btn--block" disabled={!canSubmit}>
          {submitting ? (
            <>
              <span className="spinner" /> Swapping…
            </>
          ) : (
            cta
          )}
        </button>
      </form>

      <TokenSelect
        open={picker !== null}
        tokens={tokens}
        balances={balances}
        selected={picker === "from" ? fromSym : toSym}
        disabledSymbol={picker === "from" ? toSym : fromSym}
        onSelect={selectToken}
        onClose={() => setPicker(null)}
      />

      {receipt && (
        <div className="toast" role="status">
          <span className="toast__check" aria-hidden>
            ✓
          </span>
          <div>
            <strong>Swap complete</strong>
            <p>
              Swapped {formatAmount(receipt.paid)} {receipt.from} for {formatAmount(receipt.received)} {receipt.to}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={() => setReceipt(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
    </>
  );
}

interface AmountFieldProps {
  id: string;
  label: string;
  symbol: string;
  value: string;
  usd: number;
  balance: number;
  invalid?: boolean;
  disabled?: boolean;
  onMax?: () => void;
  onChange: (value: string) => void;
  onPickToken: () => void;
}

function AmountField({
  id,
  label,
  symbol,
  value,
  usd,
  balance,
  invalid,
  disabled,
  onMax,
  onChange,
  onPickToken,
}: AmountFieldProps) {
  return (
    <div className={`field ${invalid ? "is-invalid" : ""}`}>
      <div className="field__top">
        <label htmlFor={id}>{label}</label>
        <span className="field__balance">
          Balance: {formatAmount(balance)}
          {onMax && (
            <button type="button" className="max" onClick={onMax} disabled={disabled}>
              MAX
            </button>
          )}
        </span>
      </div>
      <div className="field__row">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          disabled={disabled}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="token-btn" onClick={onPickToken} disabled={disabled}>
          {symbol ? (
            <>
              <TokenIcon symbol={symbol} />
              <span>{symbol}</span>
            </>
          ) : (
            <span>Select</span>
          )}
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path fill="currentColor" d="m7 10 5 5 5-5H7Z" />
          </svg>
        </button>
      </div>
      <div className="field__usd">{formatUsd(usd)}</div>
    </div>
  );
}
