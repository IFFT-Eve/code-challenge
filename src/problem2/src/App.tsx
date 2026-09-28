import { usePrices } from "./usePrices";
import { SwapForm } from "./SwapForm";

export default function App() {
  const { state, retry } = usePrices();

  return (
    <main className="page">
      <div className="glow glow--a" aria-hidden />
      <div className="glow glow--b" aria-hidden />

      {state.status === "loading" && (
        <section className="card card--center" aria-busy="true">
          <span className="spinner spinner--lg" />
          <p className="muted">Fetching live prices…</p>
        </section>
      )}

      {state.status === "error" && (
        <section className="card card--center" role="alert">
          <p className="error-title">Couldn’t load token prices</p>
          <p className="muted">{state.message}</p>
          <button type="button" className="btn btn--primary" onClick={retry}>
            Try again
          </button>
        </section>
      )}

      {state.status === "ready" && <SwapForm tokens={state.tokens} />}
    </main>
  );
}
