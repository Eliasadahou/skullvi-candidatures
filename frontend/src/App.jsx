import { Link, Route, Routes } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import SuperuserRoute from './components/SuperuserRoute'
import ApplyPage from './pages/ApplyPage'
import ConfirmationPage from './pages/ConfirmationPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CandidatesPage from './pages/CandidatesPage'
import CandidateDetailPage from './pages/CandidateDetailPage'
import AdminsPage from './pages/AdminsPage'
import TrackPage from './pages/TrackPage'
function NotFoundPage() {
  return (
    <div className="state">
      <h1>Page introuvable <h1 className='Erreur'>404</h1></h1>
      <p><Link to="/">Retour à l'accueil</Link></p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<ApplyPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="candidates/:id" element={<CandidateDetailPage />} />
        <Route
          path="admins"
          element={
            <SuperuserRoute>
              <AdminsPage />
            </SuperuserRoute>
          }
        />
      </Route>
        <Route element={<PublicLayout />}>
        <Route path="/" element={<ApplyPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/suivi" element={<TrackPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}