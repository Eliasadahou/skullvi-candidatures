import { Link, Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/" className="brand">SKULLVI Candidatures</Link>
          <Link to="/" className="topbar__link">Postuler</Link>
          <Link to="/suivi" className="topbar__link">Suivre ma candidature</Link>
          <Link to="/admin" className="topbar__link">Espace administrateur</Link>
        </div>
      </header>
      <main className="container page page--narrow">
        <Outlet />
      </main>
      <footer className="footer">SKULLVI – GevConsulting</footer>
    </div>
  )
}