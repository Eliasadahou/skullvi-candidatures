import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useGet } from '../api/useGet'
import { EmptyState, ErrorBox, Loading } from '../components/Status'
import ScoreBadge from '../components/ScoreBadge'
import StatusBadge from '../components/StatusBadge'
import {
  AVAILABILITY_OPTIONS,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
} from '../utils/constants'
import { formatDate } from '../utils/format'

const PAGE_SIZE = 20
const FILTER_KEYS = ['search', 'category', 'status', 'availability', 'min_score']

function FiltersBar({ initial, onApply, onReset }) {
  const [form, setForm] = useState(initial)
  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  return (
    <form
      className="filters card"
      onSubmit={(e) => {
        e.preventDefault()
        onApply(form)
      }}
    >
      <input type="search" aria-label="Recherche" placeholder="Nom, email ou identifiant" value={form.search} onChange={set('search')} />
      <select aria-label="Catégorie" value={form.category} onChange={set('category')}>
        <option value="">Toutes les catégories</option>
        {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select aria-label="Statut" value={form.status} onChange={set('status')}>
        <option value="">Tous les statuts</option>
        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select aria-label="Disponibilité" value={form.availability} onChange={set('availability')}>
        <option value="">Toutes disponibilités</option>
        {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <input type="number" min="0" max="100" aria-label="Score minimum" placeholder="Score min." value={form.min_score} onChange={set('min_score')} />
      <button type="submit" className="btn">Filtrer</button>
      <button type="button" className="btn btn--ghost" onClick={onReset}>Réinitialiser</button>
    </form>
  )
}

export default function CandidatesPage() {
  const [params, setParams] = useSearchParams()

  const filters = {}
  FILTER_KEYS.forEach((k) => { filters[k] = params.get(k) ?? '' })
  const ordering = params.get('ordering') ?? ''
  const page = Number(params.get('page') ?? '1') || 1

  const apiParams = { ...filters, ordering, page }
  Object.keys(apiParams).forEach((k) => {
    if (apiParams[k] === '' || apiParams[k] === 1) delete apiParams[k]
  })

  const { data, error, loading, reload } = useGet('/admin/applications/', apiParams)

  function applyFilters(form) {
    const next = new URLSearchParams()
    FILTER_KEYS.forEach((k) => { if (form[k]) next.set(k, form[k]) })
    if (ordering) next.set('ordering', ordering)
    setParams(next)
  }

  function updateParam(name, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next)
  }

  // 1er clic : décroissant ; 2e clic : croissant
  function toggleSort(field) {
    const current = ordering || '-score'
    const next = current === `-${field}` ? field : `-${field}`
    const nextParams = new URLSearchParams(params)
    nextParams.set('ordering', next)
    nextParams.delete('page')
    setParams(nextParams)
  }

  const currentOrdering = ordering || '-score'
  const arrow = (field) =>
    currentOrdering === field ? ' ▲' : currentOrdering === `-${field}` ? ' ▼' : ''

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  return (
    <>
      <h1>Candidats</h1>

      <FiltersBar
        key={params.toString()}
        initial={filters}
        onApply={applyFilters}
        onReset={() => setParams(new URLSearchParams())}
      />

      {loading && <Loading />}
      {error && <ErrorBox message={error.message} onRetry={reload} />}

      {data && data.results.length === 0 && (
        <EmptyState title="Aucune candidature">
          <p>Aucune candidature ne correspond à vos filtres.</p>
        </EmptyState>
      )}

      {data && data.results.length > 0 && (
        <>
          <table className="responsive card">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Candidat</th>
                <th><button type="button" onClick={() => toggleSort('score')}>Score{arrow('score')}</button></th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th><button type="button" onClick={() => toggleSort('years_experience')}>Expérience{arrow('years_experience')}</button></th>
                <th><button type="button" onClick={() => toggleSort('created_at')}>Date{arrow('created_at')}</button></th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((c) => (
                <tr key={c.id}>
                  <td data-label="Rang">#{c.rank}</td>
                  <td data-label="Candidat">
                    <Link to={`/admin/candidates/${c.id}`}>{c.full_name}</Link>
                    <div className="hint">{c.reference} · {c.email}</div>
                  </td>
                  <td data-label="Score" className="score">{c.score}</td>
                  <td data-label="Catégorie"><ScoreBadge category={c.category} label={c.category_label} /></td>
                  <td data-label="Statut"><StatusBadge status={c.status} label={c.status_label} /></td>
                  <td data-label="Expérience">{c.years_experience} an(s)</td>
                  <td data-label="Date">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button type="button" className="btn btn--ghost" disabled={!data.previous} onClick={() => updateParam('page', page > 2 ? String(page - 1) : '')}>
              Précédent
            </button>
            <span>Page {page} / {totalPages} – {data.count} candidature(s)</span>
            <button type="button" className="btn btn--ghost" disabled={!data.next} onClick={() => updateParam('page', String(page + 1))}>
              Suivant
            </button>
          </div>
        </>
      )}
    </>
  )
}