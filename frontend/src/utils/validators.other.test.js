import { describe, expect, it } from 'vitest'
import { addSkill, isKeySkill, validateApplication } from './validators'

const valid = {
  full_name: 'Aicha Dossou',
  email: 'aicha@example.com',
  phone: '',
  education_level: 'bac3',
  education_other: '',
  years_experience: '3',
  skills: ['python'],
  availability: 'immediate',
  github_url: '',
  portfolio_url: '',
  projects_description: '',
  motivation: 'Je souhaite rejoindre le programme pour progresser.',
}

describe('option Autre : études', () => {
  it('exige une précision quand le niveau est "Autre"', () => {
    const errors = validateApplication({ ...valid, education_level: 'other', education_other: ' ' })
    expect(errors.education_other).toBeTruthy()
  })
  it('accepte "Autre" avec une précision', () => {
    const errors = validateApplication({ ...valid, education_level: 'other', education_other: 'Brevet pro réseaux' })
    expect(errors).toEqual({})
  })
  it('ignore la précision quand le niveau n\'est pas "Autre"', () => {
    expect(validateApplication({ ...valid, education_other: '' })).toEqual({})
  })
})

describe('option Autre : compétences', () => {
  it('reconnaît les compétences clés sans tenir compte de la casse', () => {
    expect(isKeySkill('Python')).toBe(true)
    expect(isKeySkill(' API REST ')).toBe(true)
    expect(isKeySkill('Figma')).toBe(false)
  })
  it('respecte la limite transmise à addSkill', () => {
    expect(addSkill(['a1', 'b2'], 'c3', 2)).toEqual(['a1', 'b2'])
    expect(addSkill(['a1'], 'c3', 2)).toEqual(['a1', 'c3'])
  })
})