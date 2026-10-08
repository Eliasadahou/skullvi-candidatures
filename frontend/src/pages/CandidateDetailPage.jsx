import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, parseApiError } from '../api/client'
import { useGet } from '../api/useGet'
import { EmptyState, ErrorBox, Loading } from '../components/Status'
import ScoreBadge from '../components/ScoreBadge'
import ScoreBreakdown from '../components/ScoreBreakdown'
import StatusBadge from '../components/StatusBadge'
import {
  AVAILABILITY_OPTIONS,
  EDUCATION_OPTIONS,
  STATUS_OPTIONS,
  labelOf,
} from '../utils/constants'
import { formatDate } from '../utils/format'

function ExternalLink({ url }) {
  if (!url) return <span className="hint">Non renseigné</span>
  // Garde-fou : on n'affiche un lien cliquable que pour http(s)
  if (!/^https?:\/\//.test(url)) return <span>{url}</span>
  return <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
}

export default function CandidateDetailPage() {
  const { id } = useParams()
  const { data: c, error, loading, reload } = useGet(`/admin/applications/${id}/`)
  const [saving, setSaving] = useState(false)
  const [statusError, setStatusError] = useState(null)

  async function changeStatus(next) {
    if (saving || next === c.status) return
    setSaving(true)
    setStatusError(null)
    try {
      await api.patch(`/admin/applications/${id}/`, { status: next })
      reload()
    } catch (err) {
      setStatusError(parseApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !c) return <Loading />
  if (error?.kind === 'notfound') {
    return (
      <EmptyState title="Candidature introuvable">
        <p><Link to="/admin/candidates">Retour à la liste</Link></p>
      </EmptyState>
    )
  }
  if (error) return <ErrorBox message={error.message} onRetry={reload} />
  if (!c) return <Loading />

  const matched = new Set(c.score_details?.skills?.matched ?? [])

  return (
    <>
      <p><Link to="/admin/candidates">← Retour à la liste</Link></p>

      <div className="card detail-head">
        <div>
          <h1>{c.full_name}</h1>
          <ScoreBadge category={c.category} label={c.category_label} />{' '}
          <StatusBadge status={c.status} label={c.status_label} />
          <p className="hint">
            {c.reference} – Rang #{c.rank} – candidature du {formatDate(c.created_at)}
          </p>
        </div>
        <div className="score-big">{c.score}<small> / 100</small></div>
      </div>

      <div className="card">
        <h2>Statut de la candidature</h2>
        {statusError && <div className="banner" role="alert">{statusError}</div>}
        <div className="actions">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={o.value === c.status ? 'btn' : 'btn btn--ghost'}
              style={o.value === c.status ? undefined : { color: 'var(--primary)' }}
              disabled={saving || o.value === c.status}
              onClick={() => changeStatus(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="hint">
          Le candidat voit ce statut sur la page de suivi.
          {c.status_updated_at && ` Dernière modification le ${formatDate(c.status_updated_at)}.`}
        </p>
      </div>

      <div className="card">
        <h2>Décomposition du score</h2>
        <ScoreBreakdown details={c.score_details} />
        <p className="hint">Barème : {c.scoring_version}</p>
      </div>

      <div className="card">
        <h2>Contact</h2>
        <dl className="kv">
          <dt>Email</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd>
          <dt>Téléphone</dt><dd>{c.phone || <span className="hint">Non renseigné</span>}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Profil</h2>
        <dl className="kv">
          <dt>Études</dt>
          <dd>
            {labelOf(EDUCATION_OPTIONS, c.education_level)}
            {c.education_other ? ` : ${c.education_other}` : ''}
          </dd>
          <dt>Expérience</dt><dd>{c.years_experience} an(s)</dd>
          <dt>Disponibilité</dt><dd>{labelOf(AVAILABILITY_OPTIONS, c.availability)}</dd>
          <dt>Compétences</dt>
          <dd>
            <div className="tags" style={{ border: 0, padding: 0 }}>
              {c.skills.map((s) => (
                <span key={s} className={`tag${matched.has(s) ? ' tag--match' : ''}`}>{s}</span>
              ))}
            </div>
            <p className="hint">En vert : compétences clés reconnues par le barème.</p>
          </dd>
        </dl>
      </div>

      <div className="card">
        <h2>Preuves de travail</h2>
        <dl className="kv">
          <dt>GitHub</dt><dd><ExternalLink url={c.github_url} /></dd>
          <dt>Portfolio</dt><dd><ExternalLink url={c.portfolio_url} /></dd>
          <dt>Projets</dt>
          <dd>{c.projects_description ? <p className="prewrap">{c.projects_description}</p> : <span className="hint">Non renseigné</span>}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Motivation</h2>
        <p className="prewrap">{c.motivation}</p>
      </div>
    </>
  )
}