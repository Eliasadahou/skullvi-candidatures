export function Loading() {
  return <div className="state" role="status">Chargement…</div>
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>Réessayer</button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="state">
      <h2>{title}</h2>
      {children}
    </div>
  )
}