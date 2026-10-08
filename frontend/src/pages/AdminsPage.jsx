import { useState } from 'react'
import { api, parseApiError } from '../api/client'
import { useGet } from '../api/useGet'
import Field from '../components/Field'
import { ErrorBox, Loading } from '../components/Status'
import { useAuth } from '../context/auth'
import { formatDate } from '../utils/format'

const EMPTY = { username: '', email: '', password: '', confirm: '' }

export default function AdminsPage() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useGet('/admin/users/')
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setBanner(null)
    setSuccess(null)

    const found = {}
    if (form.username.trim().length < 3) found.username = "L'identifiant doit contenir au moins 3 caractères."
    if (form.password.length < 8) found.password = 'Le mot de passe doit contenir au moins 8 caractères.'
    if (form.password !== form.confirm) found.confirm = 'Les mots de passe ne correspondent pas.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await api.post('/admin/users/', {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      setSuccess(`Administrateur « ${form.username.trim()} » créé.`)
      setForm(EMPTY)
      reload()
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setBanner(parsed.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(admin) {
    if (!window.confirm(`Supprimer l'administrateur « ${admin.username} » ?`)) return
    setBanner(null)
    setSuccess(null)
    try {
      await api.delete(`/admin/users/${admin.id}/`)
      setSuccess(`Administrateur « ${admin.username} » supprimé.`)
      reload()
    } catch (err) {
      const parsed = parseApiError(err)
      setBanner(parsed.fields.detail || parsed.message)
    }
  }

  return (
    <>
      <h1>Administrateurs</h1>
      <p className="hint">
        Les administrateurs créés ici peuvent consulter les candidatures, mais ne peuvent pas gérer
        d'autres administrateurs.
      </p>

      <section className="card">
        <h2>Ajouter un administrateur</h2>
        <form onSubmit={handleSubmit} noValidate>
          {banner && <div className="banner" role="alert">{banner}</div>}
          {success && <p role="status" style={{ color: 'var(--green)' }}>{success}</p>}

          <div className="grid-2">
            <Field id="new_username" label="Identifiant" required error={errors.username}>
              <input id="new_username" value={form.username} onChange={set('username')} autoComplete="off" />
            </Field>
            <Field id="new_email" label="Email" error={errors.email} hint="Facultatif">
              <input id="new_email" type="email" value={form.email} onChange={set('email')} autoComplete="off" />
            </Field>
          </div>
          <div className="grid-2">
            <Field id="new_password" label="Mot de passe" required error={errors.password} hint="8 caractères minimum, pas un mot de passe courant.">
              <input id="new_password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
            </Field>
            <Field id="new_confirm" label="Confirmer le mot de passe" required error={errors.confirm}>
              <input id="new_confirm" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
            </Field>
          </div>

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Création…' : "Créer l'administrateur"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Comptes administrateurs</h2>
        {loading && <Loading />}
        {error && <ErrorBox message={error.message} onRetry={reload} />}
        {data && (
          <table className="responsive">
            <thead>
              <tr><th>Identifiant</th><th>Email</th><th>Rôle</th><th>Créé le</th><th /></tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <td data-label="Identifiant">{a.username}</td>
                  <td data-label="Email">{a.email || <span className="hint">–</span>}</td>
                  <td data-label="Rôle">
                    <span className={`badge ${a.is_superuser ? 'badge--priority' : 'badge--low'}`}>
                      {a.is_superuser ? 'Super admin' : 'Admin'}
                    </span>
                  </td>
                  <td data-label="Créé le">{formatDate(a.date_joined)}</td>
                  <td>
                    {!a.is_superuser && a.username !== user?.username && (
                      <button type="button" className="btn btn--ghost" onClick={() => handleDelete(a)}>
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}