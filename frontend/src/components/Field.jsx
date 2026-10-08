export default function Field({ id, label, required, error, hint, children }) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}