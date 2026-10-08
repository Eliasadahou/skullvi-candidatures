import { KEY_SKILLS } from './constants'

export const MAX_SKILLS = 15

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9 ]{8,18}$/
const GITHUB_RE = /^https:\/\/github\.com\/[A-Za-z0-9-]+(\/[A-Za-z0-9._-]+)?\/?$/
const HTTP_RE = /^https?:\/\/\S+$/

const EDUCATION = ['bac', 'bac2', 'bac3', 'bac5', 'other']
const AVAILABILITY = ['immediate', 'one_month', 'three_months', 'later']

// Une compétence fait-elle partie des cases à cocher ? (casse ignorée)
export function isKeySkill(skill) {
  const s = skill.trim().toLowerCase()
  return KEY_SKILLS.some((k) => k.value === s)
}

// Ajoute une compétence : 2 à 30 caractères, sans doublon (casse ignorée), `max` au plus.
export function addSkill(skills, raw, max = MAX_SKILLS) {
  const skill = raw.trim()
  if (skill.length < 2 || skill.length > 30) return skills
  if (skills.length >= max) return skills
  if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return skills
  return [...skills, skill]
}

// Validation de confort côté navigateur. Le serveur revalide toujours tout.
export function validateApplication(v) {
  const e = {}

  const name = v.full_name.trim()
  if (name.length < 2) e.full_name = 'Le nom est requis (2 caractères minimum).'
  else if (name.length > 120) e.full_name = 'Le nom est trop long (120 caractères maximum).'

  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Adresse email invalide.'

  const phone = v.phone.trim()
  if (phone && !PHONE_RE.test(phone)) {
    e.phone = 'Numéro invalide (8 à 15 chiffres, + optionnel).'
  }

  if (!EDUCATION.includes(v.education_level)) {
    e.education_level = "Choisissez un niveau d'études."
  } else if (v.education_level === 'other') {
    const other = (v.education_other ?? '').trim()
    if (other.length < 2) e.education_other = 'Précisez votre niveau ou votre diplôme.'
    else if (other.length > 100) e.education_other = '100 caractères maximum.'
  }

  const years = Number(v.years_experience)
  if (String(v.years_experience).trim() === '' || !Number.isInteger(years) || years < 0 || years > 40) {
    e.years_experience = 'Indiquez un nombre entier entre 0 et 40.'
  }

  if (v.skills.length < 1) e.skills = 'Choisissez ou ajoutez au moins une compétence.'
  else if (v.skills.length > MAX_SKILLS) e.skills = `${MAX_SKILLS} compétences maximum.`

  if (!AVAILABILITY.includes(v.availability)) e.availability = 'Choisissez une disponibilité.'

  const github = v.github_url.trim()
  if (github && !GITHUB_RE.test(github)) {
    e.github_url = 'Le lien doit commencer par https://github.com/'
  }

  const portfolio = v.portfolio_url.trim()
  if (portfolio && !HTTP_RE.test(portfolio)) {
    e.portfolio_url = 'Le lien doit commencer par http:// ou https://'
  }

  if (v.projects_description.trim().length > 1500) {
    e.projects_description = '1500 caractères maximum.'
  }

  const motivation = v.motivation.trim()
  if (motivation.length < 20) e.motivation = 'Minimum 20 caractères.'
  else if (motivation.length > 1500) e.motivation = '1500 caractères maximum.'

  return e
}