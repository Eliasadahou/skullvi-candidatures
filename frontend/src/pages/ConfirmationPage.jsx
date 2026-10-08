import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

export default function ConfirmationPage() {
  const { state } = useLocation()
  const [copied, setCopied] = useState(false)

  // Accessible uniquement après un envoi réussi
  if (!state?.reference || !state?.email) return <Navigate to="/" replace />
  const { reference, email } = state

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
    } catch {
      setCopied(false)
      window.prompt('Copiez votre identifiant :', reference)
    }
  }

  function download() {
    const content =
      `SKULLVI - Suivi de candidature\n` +
      `Identifiant : ${reference}\n` +
      `Email utilisé : ${email}\n` +
      `Suivi : ${window.location.origin}/suivi\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${reference}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card state">
      <h1>Candidature reçue</h1>
      <p>Merci ! Votre candidature a bien été enregistrée. Voici votre identifiant de suivi :</p>

      <div className="ref-box" aria-label="Identifiant de candidature">{reference}</div>

      <div className="notice" role="note">
        <strong>Conservez cet identifiant.</strong> Il ne sera plus affiché sur cette page. Pour
        consulter l'état de votre candidature, vous aurez besoin de cet identifiant et de l'email
        utilisé : <strong>{email}</strong>.
      </div>

      <div className="actions" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn" onClick={copy}>
          {copied ? 'Copié !' : "Copier l'identifiant"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={download}>Télécharger (.txt)</button>
        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>Imprimer</button>
      </div>

      <p style={{ marginTop: 20 }}>
        <Link to={`/suivi?ref=${encodeURIComponent(reference)}`}>Suivre ma candidature</Link>
        {' · '}
        <Link to="/">Retour à l'accueil</Link>
      </p>
    </div>
  )
}