import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import Field from '../components/Field'
import StatusBadge from '../components/StatusBadge'
import { STATUS_MESSAGES } from '../utils/constants'
import { formatDate } from '../utils/format'

export default function TrackPage() {
  const [params] = useSearchParams()
  const [reference, setReference] = useState(params.get('ref') ?? '')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setError(null)
    setResult(null)

    if (!reference.trim() || !email.trim()) {
      setError('Renseignez votre identifiant et votre email.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/applications/status/', {
        reference: reference.trim(),
        email: email.trim(),
      })
      setResult(data)
    } catch (err) {
      const status = err.response?.status
      if (status === 404) {
        setError(err.response.data?.detail || 'Aucune candidature ne correspond à ces informations.')
      } else if (status === 429) {
        setError('Trop de tentatives. Réessayez plus tard.')
      } else if (!err.response) {
        setError('Connexion impossible, réessayez.')
      } else {
        setError('Une erreur est survenue. Réessayez plus tard.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Suivre ma candidature</h1>
      <p className="hint">
        Saisissez l'identifiant reçu après votre inscription (ex. SKU2026-0001) et l'email utilisé.
      </p>

      <form onSubmit={handleSubmit} className="card" noValidate>
        {error && <div className="banner" role="alert">{error}</div>}
        <Field id="reference" label="Identifiant de candidature" required>
          <input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="SKU2026-0001"
            autoComplete="off"
          />
        </Field>
        <Field id="track_email" label="Email utilisé lors de la candidature" required>
          <input
            id="track_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Recherche…' : "Consulter l'état"}
        </button>
      </form>

      {result && (
        <section className="card" aria-live="polite">
          <h2>Candidature {result.reference}</h2>
          <p><StatusBadge status={result.status} label={result.status_label} /></p>
          <p>{STATUS_MESSAGES[result.status]}</p>
          <p className="hint">
            Déposée le {formatDate(result.submitted_at)}
            {result.status_updated_at && ` – dernière mise à jour le ${formatDate(result.status_updated_at)}`}
          </p>
        </section>
      )}
    </>
  )
}