import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth'

export default function SuperuserRoute({ children }) {
  const { isSuperuser } = useAuth()
  if (!isSuperuser) return <Navigate to="/admin" replace />
  return children
}