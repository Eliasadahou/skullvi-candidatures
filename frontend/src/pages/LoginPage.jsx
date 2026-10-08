import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { parseApiError } from '../api/client'
import { useAuth } from '../context/auth'
import Field from '../components/Field'

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      const parsed = parseApiError(err)
      // Message volontairement générique : on ne précise pas lequel est faux
      setError(parsed.kind === 'validation' ? 'Identifiants incorrects.' : parsed.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h1>Connexion administrateur</h1>
      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="banner" role="alert">{error}</div>}
        <Field id="username" label="Identifiant" required>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </Field>
        <Field id="password" label="Mot de passe" required>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <button type="submit" className="btn" disabled={submitting || !username || !password}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}