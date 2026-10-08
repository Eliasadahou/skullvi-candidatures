import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, parseApiError } from '../api/client'
import Field from '../components/Field'
import TagInput from '../components/TagInput'
import {
  AVAILABILITY_OPTIONS,
  EDUCATION_OPTIONS,
  KEY_SKILLS,
} from '../utils/constants'
import { isKeySkill, MAX_SKILLS, validateApplication } from '../utils/validators'

const INITIAL = {
  full_name: '',
  email: '',
  phone: '',
  education_level: '',
  education_other: '',
  years_experience: '',
  skills: [],
  availability: '',
  github_url: '',
  portfolio_url: '',
  projects_description: '',
  motivation: '',
}

export default function ApplyPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  // Les compétences sont stockées dans une seule liste ; l'interface la sépare en deux :
  // cases à cocher (compétences clés) et saisie libre (autres compétences).
  const keySelected = values.skills.filter(isKeySkill).map((s) => s.trim().toLowerCase())
  const others = values.skills.filter((s) => !isKeySkill(s))
  const setSkills = (skills) => setValues((v) => ({ ...v, skills }))

  function toggleKey(value) {
    if (keySelected.includes(value)) {
      setSkills(values.skills.filter((s) => s.trim().toLowerCase() !== value))
    } else if (values.skills.length < MAX_SKILLS) {
      setSkills([...values.skills, value])
    }
  }

  function setOthers(newOthers) {
    const extra = newOthers.filter((s) => !keySelected.includes(s.trim().toLowerCase()))
    setSkills([...keySelected, ...extra])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setBanner(null)

    const found = validateApplication(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setBanner('Veuillez corriger les champs signalés.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        education_level: values.education_level,
        education_other: values.education_level === 'other' ? values.education_other.trim() : '',
        years_experience: Number(values.years_experience),
        skills: values.skills,
        availability: values.availability,
        github_url: values.github_url.trim(),
        portfolio_url: values.portfolio_url.trim(),
        projects_description: values.projects_description.trim(),
        motivation: values.motivation.trim(),
      }
      const { data: created } = await api.post('/applications/', payload)
      navigate('/confirmation', {
        state: { email: payload.email, reference: created.reference },
        replace: true,
      })
    } catch (err) {
      const parsed = parseApiError(err)
      setErrors(parsed.fields)
      setBanner(parsed.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Déposer ma candidature</h1>
      <p className="hint">
        Les champs marqués d'une étoile sont obligatoires. Prenez quelques minutes pour présenter
        votre profil avec précision.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {banner && <div className="banner" role="alert">{banner}</div>}

        <section className="card">
          <h2>Identité</h2>
          <Field id="full_name" label="Nom complet" required error={errors.full_name}>
            <input id="full_name" value={values.full_name} onChange={set('full_name')} autoComplete="name" maxLength={120} />
          </Field>
          <div className="grid-2">
            <Field id="email" label="Email" required error={errors.email}>
              <input id="email" type="email" value={values.email} onChange={set('email')} autoComplete="email" />
            </Field>
            <Field id="phone" label="Téléphone" error={errors.phone} hint="Facultatif">
              <input id="phone" type="tel" value={values.phone} onChange={set('phone')} autoComplete="tel" />
            </Field>
          </div>
        </section>

        <section className="card">
          <h2>Profil</h2>
          <div className="grid-2">
            <Field id="education_level" label="Niveau d'études" required error={errors.education_level}>
              <select id="education_level" value={values.education_level} onChange={set('education_level')}>
                <option value="">Choisir…</option>
                {EDUCATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field id="years_experience" label="Années d'expérience" required error={errors.years_experience}>
              <input id="years_experience" type="number" min="0" max="40" step="1" value={values.years_experience} onChange={set('years_experience')} />
            </Field>
          </div>

          {values.education_level === 'other' && (
            <Field
              id="education_other"
              label="Précisez votre niveau ou diplôme"
              required
              error={errors.education_other}
              hint="Ex. Brevet professionnel en réseaux, formation autodidacte certifiée…"
            >
              <input id="education_other" value={values.education_other} onChange={set('education_other')} maxLength={100} />
            </Field>
          )}

          <Field
            id="skills"
            label="Compétences et technologies"
            required
            error={errors.skills}
            hint="Cochez celles que vous maîtrisez."
          >
            <div className="checks" role="group" aria-label="Compétences principales">
              {KEY_SKILLS.map((k) => {
                const on = keySelected.includes(k.value)
                return (
                  <label key={k.value} className={`check${on ? ' check--on' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => toggleKey(k.value)} />
                    {k.label}
                  </label>
                )
              })}
            </div>
          </Field>

          <Field
            id="other_skills"
            label="Autres compétences"
            hint="Ajoutez ici celles qui ne sont pas dans la liste (Entrée ou virgule pour valider)."
          >
            <TagInput
              id="other_skills"
              value={others}
              max={MAX_SKILLS - keySelected.length}
              onChange={setOthers}
            />
          </Field>

          <Field id="availability" label="Disponibilité" required error={errors.availability}>
            <select id="availability" value={values.availability} onChange={set('availability')}>
              <option value="">Choisir…</option>
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </section>

        <section className="card">
          <h2>Preuves et motivation</h2>
          <div className="grid-2">
            <Field id="github_url" label="Lien GitHub" error={errors.github_url} hint="Ex. https://github.com/votre-nom">
              <input id="github_url" type="url" value={values.github_url} onChange={set('github_url')} />
            </Field>
            <Field id="portfolio_url" label="Lien portfolio" error={errors.portfolio_url} hint="Facultatif">
              <input id="portfolio_url" type="url" value={values.portfolio_url} onChange={set('portfolio_url')} />
            </Field>
          </div>
          <Field
            id="projects_description"
            label="Projets réalisés"
            error={errors.projects_description}
            hint={`${values.projects_description.length}/1500 – Décrivez vos projets en quelques phrases.`}
          >
            <textarea id="projects_description" value={values.projects_description} onChange={set('projects_description')} maxLength={1500} />
          </Field>
          <Field
            id="motivation"
            label="Motivation"
            required
            error={errors.motivation}
            hint={`${values.motivation.length}/1500 – Minimum 20 caractères.`}
          >
            <textarea id="motivation" value={values.motivation} onChange={set('motivation')} maxLength={1500} />
          </Field>
        </section>

        <div className="actions">
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Envoi en cours…' : 'Envoyer ma candidature'}
          </button>
        </div>
      </form>
    </>
  )
}