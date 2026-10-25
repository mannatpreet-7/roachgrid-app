import { Component } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
export function PageTitle({ eyebrow, title, description, children }) {
  return (
    <header className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </header>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <MapPin size={28} />
      <h3>{title}</h3>
      <p className="muted">{children}</p>
    </div>
  );
}
export function AsyncState({ state }) {
  if (state.loading)
    return (
      <div className="loading" role="status">
        <span className="spinner" /> Loading…
      </div>
    );
  if (state.error)
    return (
      <div className="error" role="alert">
        <p>{state.error}</p>
        <button onClick={state.retry}>
          Try again <ArrowUpRight size={14} />
        </button>
      </div>
    );
  return null;
}
export class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="container">
        <h1>Something went wrong</h1>
        <p>Your browser-local data has not been cleared.</p>
        <button onClick={() => window.location.reload()}>
          Reload application
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
