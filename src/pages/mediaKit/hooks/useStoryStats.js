import { useEffect, useMemo, useState } from 'react'

export function useStoryStats(days = 30) {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    fetch(`/api/instagram?action=story-stats&days=${days}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (!j.ok) {
          setState({ loading: false, data: null, error: j.error || 'Stats stories indisponibles' })
          return
        }
        setState({ loading: false, data: j, error: null })
      })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, data: null, error: 'API stories indisponible' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [days])

  return useMemo(() => {
    const storyCount = state.data?.summary?.storyCount || 0
    const views = state.data?.summary?.totals?.views
    const averageViews =
      storyCount > 0 && typeof views === 'number' ? views / storyCount : null

    return {
      ...state,
      storyCount,
      totals: state.data?.summary?.totals || {},
      averageViews,
      updatedAt: state.data?.updatedAt || null,
    }
  }, [state])
}
