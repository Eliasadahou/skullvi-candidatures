import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'

export default function AdminLayout() {
  const { logout, user, isSuperuser } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <span className="brand">SKULLVI Admin</span>
          <nav className="nav">
            <NavLink to="/admin" end>Dashboard</NavLink>
            <NavLink to="/admin/candidates">Candidats</NavLink>
            {isSuperuser && <NavLink to="/admin/admins">Administrateurs</NavLink>}
          </nav>
          {user && <span className="topbar__link">{user.username}</span>}
          <button type="button" className="btn btn--ghost" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>
      <main className="container page">
        <Outlet />
      </main>
    </div>
  )
}