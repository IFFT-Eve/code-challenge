import { useState } from "react";
import { tokenIconUrl } from "./constants";

const PALETTE = ["#7c5cff", "#00b3a4", "#ff7a59", "#2f80ed", "#e2b100", "#d6457a"];

function colorFor(symbol: string) {
  let h = 0;
  for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function TokenIcon({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (failed) {
    return (
      <span
        className="token-icon token-icon--fallback"
        style={{ ...style, background: colorFor(symbol), fontSize: size * 0.4 }}
        aria-hidden
      >
        {symbol.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      className="token-icon"
      src={tokenIconUrl(symbol)}
      alt=""
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
