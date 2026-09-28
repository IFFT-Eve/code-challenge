export const PRICES_URL = "https://interview.switcheo.com/prices.json";

// The price feed upper-cases some symbols whose icon files use a lowercase prefix.
const ICON_ALIASES: Record<string, string> = {
  RATOM: "rATOM",
  STATOM: "stATOM",
  STEVMOS: "stEVMOS",
  STLUNA: "stLUNA",
  STOSMO: "stOSMO",
};

export const tokenIconUrl = (symbol: string) =>
  `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${ICON_ALIASES[symbol] ?? symbol}.svg`;

/** Simulated delay for the mock swap request. */
export const SWAP_DELAY_MS = 1600;
