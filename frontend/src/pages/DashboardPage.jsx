import { Link } from 'react-router-dom'
import { useGet } from '../api/useGet'
import { ErrorBox, Loading } from '../components/Status'
import ScoreBadge from '../components/ScoreBadge'
import { AVAILABILITY_OPTIONS, labelOf } from '../utils/constants'

export default function DashboardPage() {
  const stats = useGet('/admin/stats/')
  const top = useGet('/admin/applications/', { category: 'priority', ordering: '-score' })

  if (stats.loading || top.loading) return <Loading />
  const error = stats.error || top.error
  if (error) {
    return (
      <ErrorBox
        message={error.message}
        onRetry={() => {
          stats.reload()
          top.reload()
        }}
      />
    )
  }

  const s = stats.data
  const best = top.data.results.slice(0, 5)
  const cards = [
    { label: 'Candidatures', value: s.total, to: '/admin/candidates' },
    { label: 'Profils prioritaires', value: s.by_category.priority, to: '/admin/candidates?category=priority' },
    { label: 'À examiner', value: s.by_category.review, to: '/admin/candidates?category=review' },
    { label: 'Faible priorité', value: s.by_category.low, to: '/admin/candidates?category=low' },
  ]

  return (
    <>
      <h1>Dashboard</h1>
      <p className="hint">Score moyen : <strong>{s.average_score ?? 0}</strong> / 100</p>

      <div className="stats">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="stat">
            <div className="stat__value">{c.value}</div>
            <div className="stat__label">{c.label}</div>
          </Link>
        ))}
      </div>

      <section className="card">
        <h2>Les 5 meilleurs profils prioritaires</h2>
        {best.length === 0 ? (
          <p className="hint">Aucun profil prioritaire pour le moment.</p>
        ) : (
          <table className="responsive">
            <thead>
              <tr><th>Rang</th><th>Candidat</th><th>Score</th><th>Catégorie</th><th>Disponibilité</th></tr>
            </thead>
            <tbody>
              {best.map((c) => (
                <tr key={c.id}>
                  <td data-label="Rang">#{c.rank}</td>
                  <td data-label="Candidat"><Link to={`/admin/candidates/${c.id}`}>{c.full_name}</Link></td>
                  <td data-label="Score" className="score">{c.score}</td>
                  <td data-label="Catégorie"><ScoreBadge category={c.category} label={c.category_label} /></td>
                  <td data-label="Disponibilité">{labelOf(AVAILABILITY_OPTIONS, c.availability)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}