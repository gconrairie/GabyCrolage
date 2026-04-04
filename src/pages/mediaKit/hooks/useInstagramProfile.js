import { useEffect, useState } from 'react'

export function useInstagramProfile() {
  const [followersCount, setFollowersCount] = useState(null)
  const [profileErr, setProfileErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/instagram?action=profile')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (!j.ok) {
          setProfileErr(j.error || 'Profil indisponible')
          return
        }
        if (typeof j.profile?.followers_count === 'number') {
          setFollowersCount(j.profile.followers_count)
          setProfileErr(null)
        } else {
          setProfileErr('Nombre d’abonnés indisponible')
        }
      })
      .catch(() => {
        if (!cancelled) setProfileErr('API indisponible')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { followersCount, profileErr }
}
