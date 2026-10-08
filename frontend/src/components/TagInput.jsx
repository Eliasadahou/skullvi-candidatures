import { useState } from 'react'
import { addSkill, MAX_SKILLS } from '../utils/validators'

export default function TagInput({ id, value, onChange, error, max = MAX_SKILLS, placeholder }) {
  const [draft, setDraft] = useState('')

  function commit() {
    if (draft.trim()) onChange(addSkill(value, draft, max))
    setDraft('')
  }

  function handleChange(e) {
    const text = e.target.value
    if (text.includes(',')) {
      // Une virgule valide les compétences saisies (ou collées) avant elle
      const parts = text.split(',')
      const rest = parts.pop()
      onChange(parts.reduce((acc, p) => addSkill(acc, p, max), value))
      setDraft(rest)
    } else {
      setDraft(text)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className={`tags${error ? ' tags--error' : ''}`}>
      {value.map((skill) => (
        <span className="tag" key={skill}>
          {skill}
          <button
            type="button"
            aria-label={`Retirer ${skill}`}
            onClick={() => onChange(value.filter((s) => s !== skill))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        disabled={value.length >= max}
        placeholder={value.length ? '' : placeholder || 'Ex. Linux, Figma…'}
        autoComplete="off"
      />
    </div>
  )
}