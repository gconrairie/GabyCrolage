import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import '../MediaKit.css'
import { MEDIA_KIT, AGE_BARS, CITIES, OFFERS, REELS } from './data'
import { formatMediaKitDate, bestReelViewsForHero } from './utils'
import { formatCompactMetric } from './numberFormat'
import { useInstagramProfile } from './hooks/useInstagramProfile'
import { useReelGridMetrics } from './hooks/useReelGridMetrics'
import MediaKitCover from './MediaKitCover'
import MediaKitProfile from './MediaKitProfile'
import MediaKitPerformances from './MediaKitPerformances'
import MediaKitReelsTable from './MediaKitReelsTable'
import MediaKitAudience from './MediaKitAudience'
import MediaKitOffers from './MediaKitOffers'
import MediaKitContact from './MediaKitContact'
import MediaKitFooter from './MediaKitFooter'

export default function MediaKit() {
  const h = MEDIA_KIT.hero
  const perf = MEDIA_KIT.performances
  const aud = MEDIA_KIT.audience
  const c = MEDIA_KIT.contact
  const kitUpdatedLabel = formatMediaKitDate(MEDIA_KIT.meta?.lastUpdated)
  const metaLastUpdated = MEDIA_KIT.meta.lastUpdated

  const { followersCount, profileErr } = useInstagramProfile()
  const reelGrid = useReelGridMetrics(REELS)

  const followersFormatted = useMemo(() => {
    if (followersCount == null) return null
    return formatCompactMetric(followersCount)
  }, [followersCount])

  const bestReelFormatted = useMemo(() => {
    const views = bestReelViewsForHero(REELS, reelGrid)
    if (views == null) return null
    return formatCompactMetric(views)
  }, [reelGrid])

  const heroStats = useMemo(() => {
    return h.stats.map((s) => {
      if (s.label === 'Abonnés' && followersFormatted) {
        return { ...s, value: followersFormatted }
      }
      if (s.label === 'Best reel' && bestReelFormatted) {
        return { ...s, value: bestReelFormatted }
      }
      return s
    })
  }, [h.stats, followersFormatted, bestReelFormatted])

  const perfCells = useMemo(() => {
    return perf.cells.map((cell) => ({
      ...cell,
      value:
        cell.label === 'Abonnés' && followersFormatted ? followersFormatted : cell.value,
    }))
  }, [perf.cells, followersFormatted])

  useEffect(() => {
    document.title = 'Media Kit — Gaby Crolage'
    const metaRobots = document.createElement('meta')
    metaRobots.name = 'robots'
    metaRobots.content = 'noindex, nofollow, noarchive'
    document.head.appendChild(metaRobots)
    return () => {
      document.head.removeChild(metaRobots)
    }
  }, [])

  return (
    <div className="mkit">
      <a href="#mkit-main" className="mkit-skip">
        Aller au contenu
      </a>

      <div className="mkit-frame">
        <nav className="mkit-back" aria-label="Navigation">
          <Link to="/" className="mkit-back__link">
            <FontAwesomeIcon icon={faArrowLeft} className="mkit-back__icon" aria-hidden />
            <span>Accueil</span>
          </Link>
        </nav>
        <MediaKitCover
          hero={h}
          metaLastUpdated={metaLastUpdated}
          kitUpdatedLabel={kitUpdatedLabel}
          profileErr={profileErr}
          heroStats={heroStats}
          followersFormatted={followersFormatted}
        />

        <main className="mkit-main" id="mkit-main">
          <MediaKitProfile />
          <MediaKitPerformances perfCells={perfCells} />
          <MediaKitReelsTable reelGrid={reelGrid} />
          <MediaKitAudience audience={aud} ageBars={AGE_BARS} cities={CITIES} />
          <MediaKitOffers offers={OFFERS} />
          <MediaKitContact contact={c} />
        </main>

        <MediaKitFooter year={h.year} metaLastUpdated={metaLastUpdated} kitUpdatedLabel={kitUpdatedLabel} />
      </div>
    </div>
  )
}
