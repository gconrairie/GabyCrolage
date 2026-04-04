import { useEffect, useState } from 'react'

/**
 * Charge les insights pour chaque reel (shortcode) en parallèle.
 * @param {Array<{ id: string }>} reelList
 */
export function useReelGridMetrics(reelList) {
  const [reelGrid, setReelGrid] = useState(() =>
    Object.fromEntries(reelList.map((r) => [r.id, { loading: true }])),
  )

  useEffect(() => {
    let cancelled = false
    reelList.forEach((reel) => {
      const id = reel.id
      fetch(`/api/instagram?action=reel&mediaId=${encodeURIComponent(id)}`)
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return
          if (!j.ok) {
            setReelGrid((prev) => ({
              ...prev,
              [id]: { loading: false, error: j.error || 'Erreur API' },
            }))
            return
          }
          setReelGrid((prev) => ({
            ...prev,
            [id]: { loading: false, data: j },
          }))
        })
        .catch(() => {
          if (cancelled) return
          setReelGrid((prev) => ({
            ...prev,
            [id]: { loading: false, error: 'Requête impossible.' },
          }))
        })
    })
    return () => {
      cancelled = true
    }
  }, [reelList])

  return reelGrid
}
