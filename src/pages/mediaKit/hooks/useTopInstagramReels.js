import { useEffect, useState } from 'react'

export function useTopInstagramReels() {
  const [state, setState] = useState({ loading: true, reels: [], error: null, note: '' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/instagram?action=top-reels&limit=5&scanLimit=100')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (!j.ok) {
          setState({
            loading: false,
            reels: [],
            error: j.error || 'Classement des reels indisponible',
            note: '',
          })
          return
        }
        setState({ loading: false, reels: j.reels || [], error: null, note: j.note || '' })
      })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, reels: [], error: 'API reels indisponible', note: '' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
