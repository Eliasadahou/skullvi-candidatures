import axios from 'axios'

export const TOKEN_KEY = 'skullvi_token'
export const USER_KEY = 'skullvi_user'
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 15000,
})

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* stockage indisponible : la session ne sera pas conservée */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* rien à faire */
  }
}

// Infos d'affichage uniquement (nom, super admin ?). Les droits réels sont vérifiés par le serveur.
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function setUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* stockage indisponible */
  }
}

// Ajoute le token à chaque requête s'il existe
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Token ${token}`
  return config
})

// 401 sur une page admin : on supprime le token et on renvoie vers la connexion
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes('/auth/login/')
    if (error.response?.status === 401 && !isLogin) {
      clearToken()
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.assign('/admin/login')
      }
    }
    return Promise.reject(error)
  },
)

// Aplatit les messages d'erreur DRF (chaîne, liste ou objet imbriqué) en une phrase
function flatten(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(flatten).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(flatten).join(' ')
  return String(value)
}

// Transforme une erreur axios en objet simple utilisable par l'interface
export function parseApiError(error) {
  if (!error.response) {
    return { kind: 'network', message: 'Connexion impossible, réessayez.', fields: {} }
  }
  const { status, data } = error.response
  switch (status) {
    case 400: {
      const fields = {}
      if (data && typeof data === 'object') {
        for (const [key, value] of Object.entries(data)) fields[key] = flatten(value)
      }
      return { kind: 'validation', message: 'Veuillez corriger les champs signalés.', fields }
    }
    case 401:
      return { kind: 'auth', message: 'Session expirée. Veuillez vous reconnecter.', fields: {} }
    case 403:
      return { kind: 'forbidden', message: "Vous n'avez pas accès à cette ressource.", fields: {} }
    case 404:
      return { kind: 'notfound', message: 'Ressource introuvable.', fields: {} }
    case 409:
      return {
        kind: 'conflict',
        message: 'Une candidature avec cet email a déjà été reçue.',
        fields: {},
      }
    case 429:
      return {
        kind: 'throttled',
        message: 'Trop de tentatives. Réessayez plus tard.',
        fields: {},
      }
    default:
      return {
        kind: 'server',
        message: 'Une erreur est survenue. Réessayez plus tard.',
        fields: {},
      }
  }
}