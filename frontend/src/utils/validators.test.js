import { describe, expect, it } from 'vitest'
import { addSkill, validateApplication } from './validators'

const valid = {
  full_name: 'Aicha Dossou',
  email: 'aicha@example.com',
  phone: '',
  education_level: 'bac3',
  years_experience: '3',
  skills: ['python'],
  availability: 'immediate',
  github_url: '',
  portfolio_url: '',
  projects_description: '',
  motivation: 'Je souhaite rejoindre le programme pour progresser.',
}

describe('validateApplication', () => {
  it('accepte un formulaire valide', () => {
    expect(validateApplication(valid)).toEqual({})
  })

  it.each(['abc@', 'abc.com', ''])('TF-01 email invalide : "%s"', (email) => {
    expect(validateApplication({ ...valid, email }).email).toBeTruthy()
  })

  it.each(['', '  ', 'A'])('TF-02 nom invalide : "%s"', (full_name) => {
    expect(validateApplication({ ...valid, full_name }).full_name).toBeTruthy()
  })

  it.each(['-1', '41', 'abc', '', '2.5'])('TF-03 expérience invalide : "%s"', (years_experience) => {
    expect(validateApplication({ ...valid, years_experience }).years_experience).toBeTruthy()
  })

  it.each(['0', '40'])('expérience valide aux bornes : %s', (years_experience) => {
    expect(validateApplication({ ...valid, years_experience }).years_experience).toBeUndefined()
  })

  it('TF-04 GitHub : valide ou invalide', () => {
    expect(validateApplication({ ...valid, github_url: 'https://github.com/aicha' }).github_url).toBeUndefined()
    expect(validateApplication({ ...valid, github_url: 'https://gitlab.com/aicha' }).github_url).toBeTruthy()
  })

  it('TF-05 compétences : aucune ou 16', () => {
    expect(validateApplication({ ...valid, skills: [] }).skills).toBeTruthy()
    const sixteen = Array.from({ length: 16 }, (_, i) => `skill${i}`)
    expect(validateApplication({ ...valid, skills: sixteen }).skills).toBeTruthy()
  })

  it('TF-06 motivation de 10 caractères', () => {
    expect(validateApplication({ ...valid, motivation: '0123456789' }).motivation).toBeTruthy()
  })
})

describe('addSkill', () => {
  it('ajoute et retire les espaces', () => {
    expect(addSkill([], '  React ')).toEqual(['React'])
  })
  it('ignore les doublons sans tenir compte de la casse', () => {
    expect(addSkill(['React'], 'react')).toEqual(['React'])
  })
  it('refuse trop court, trop long, ou au-delà de 15', () => {
    expect(addSkill([], 'a')).toEqual([])
    expect(addSkill([], 'x'.repeat(31))).toEqual([])
    const full = Array.from({ length: 15 }, (_, i) => `skill${i}`)
    expect(addSkill(full, 'python')).toEqual(full)
  })
})