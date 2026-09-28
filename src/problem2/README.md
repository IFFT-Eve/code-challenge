# Problem 2 — Fancy Swap Form

A currency swap form built with **Vite + React + TypeScript** and plain CSS.

## Run

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## Features

- Live prices from `https://interview.switcheo.com/prices.json`. Duplicate entries are collapsed to the most recent price, and tokens without a valid price are dropped.
- Token icons from the Switcheo `token-icons` repo, with a coloured initials badge when an icon is missing.
- Two-way input: type in either **You pay** or **You receive** and the other side is computed as `amount × priceFrom / priceTo`.
- A searchable token picker: filter as you type, navigate with the arrow keys, select with Enter, close with Esc. Tokens you hold are listed first. Picking the token already on the other side flips the pair.
- A flip button, a rate line you can click to invert, USD values for each side, and a minimum-received figure at 0.5% slippage.
- Validation:
  - amount inputs accept numbers only, with a single decimal point, and pasted text is cleaned up
  - you can't send more than your balance
  - the two tokens must be different
  - the submit button's label always says what's missing
- A mock wallet with balances and a MAX button. The swap is simulated with a spinner, then a success toast, and the balances update afterwards.
- Loading and error states (with a retry button) for the price feed.
- Dark mode, mobile layout, keyboard focus styles, and a reduced-motion setting.

## Structure

```
index.html        Vite HTML entry
script.js         entry module (imports style.css + src/main.tsx)
style.css         all styles
src/
  App.tsx         loading / error / ready states
  SwapForm.tsx    form logic, validation, mock submit
  TokenSelect.tsx searchable token modal
  TokenIcon.tsx   icon with fallback
  usePrices.ts    fetch + normalize price feed
  format.ts       number formatting & input sanitizing
  constants.ts    URLs and config
```
