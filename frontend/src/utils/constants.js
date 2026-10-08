export const EDUCATION_OPTIONS = [
  { value: 'bac', label: 'Baccalauréat' },
  { value: 'bac2', label: 'Bac+2' },
  { value: 'bac3', label: 'Bac+3 (Licence)' },
  { value: 'bac5', label: 'Bac+5 et plus' },
  { value: 'other', label: 'Autre (à préciser)' },
]

// Compétences clés proposées en cases à cocher.
// Doit rester cohérent avec KEY_SKILLS de backend/applications/scoring_config.py
export const KEY_SKILLS = [
  { value: 'python', label: 'Python' },
  { value: 'django', label: 'Django' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'react', label: 'React' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'git', label: 'Git' },
  { value: 'api rest', label: 'API REST' },
  { value: 'docker', label: 'Docker' },
]

export const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immédiate' },
  { value: 'one_month', label: 'Sous 1 mois' },
  { value: 'three_months', label: 'Sous 3 mois' },
  { value: 'later', label: 'Plus tard' },
]

export const CATEGORY_OPTIONS = [
  { value: 'priority', label: 'Profil prioritaire' },
  { value: 'review', label: 'À examiner' },
  { value: 'low', label: 'Faible priorité' },
]

export const CRITERIA_LABELS = {
  skills: 'Compétences clés',
  experience: 'Expérience',
  education: 'Études',
  links: 'Preuves de travail',
  availability: 'Disponibilité',
  motivation: 'Motivation',
}

export const labelOf = (options, value) =>
  options.find((o) => o.value === value)?.label ?? value
export const STATUS_OPTIONS = [
  { value: 'pending', label: "En cours d'évaluation" },
  { value: 'accepted', label: 'Accepté' },
  { value: 'rejected', label: 'Rejeté' },
]

// Messages affichés au candidat sur la page de suivi
export const STATUS_MESSAGES = {
  pending: "Votre candidature est en cours d'évaluation. Revenez consulter cette page plus tard.",
  accepted: "Félicitations, votre candidature a été acceptée. L'équipe vous contactera prochainement.",
  rejected:
    "Nous sommes désolés : votre candidature n'a pas été retenue cette fois-ci. Merci de l'intérêt que vous portez à SKULLVI.",
}