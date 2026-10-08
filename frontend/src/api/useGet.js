import { useCallback, useEffect, useState } from 'react'
import { api, parseApiError } from './client'

// Charge une URL en GET et gère les états chargement / erreur / données.
export function useGet(url, params) {
  const key = JSON.stringify(params ?? {})
  const [tick, setTick] = useState(0)
  const [result, setResult] = useState({ id: null, data: null, error: null })

  const reload = useCallback(() => setTick((t) => t + 1), [])

  // Identifie la requête courante (URL + paramètres + nombre de rechargements)
  const requestId = `${url}?${key}#${tick}`

  useEffect(() => {
    let cancelled = false
    api
      .get(url, { params: JSON.parse(key) })
      .then((res) => {
        if (!cancelled) setResult({ id: requestId, data: res.data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ id: requestId, data: null, error: parseApiError(err) })
      })
    return () => {
      cancelled = true
    }
  }, [url, key, requestId])

  // Tant que le résultat reçu ne correspond pas à la requête courante, on charge
  const loading = result.id !== requestId

  return {
    data: result.data, // conserve l'ancienne page pendant un rechargement
    error: loading ? null : result.error,
    loading,
    reload,
  }
}