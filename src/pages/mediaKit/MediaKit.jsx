import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import '../MediaKit.css'
import { MEDIA_KIT } from './data'
import { formatMediaKitDateTime } from './utils'
import { formatCompactMetric } from './numberFormat'
import { useInstagramInsights } from './hooks/useInstagramInsights'
import { useTopInstagramReels } from './hooks/useTopInstagramReels'
import MetricSpinner from './MetricSpinner'
import MediaKitCover from './MediaKitCover'
import MediaKitProfile from './MediaKitProfile'
import MediaKitPerformances from './MediaKitPerformances'
import MediaKitReelsTable from './MediaKitReelsTable'
import MediaKitAudience from './MediaKitAudience'
import MediaKitContact from './MediaKitContact'
import MediaKitFooter from './MediaKitFooter'

export default function MediaKit() {
  const h = MEDIA_KIT.hero
  const c = MEDIA_KIT.contact

  const insights = useInstagramInsights()
  const topReels = useTopInstagramReels()
  const refreshedAt = insights.data?.cache?.cachedAt || insights.data?.fetchedAt || ''
  const kitUpdated = formatMediaKitDateTime(refreshedAt)

  const followersFormatted = useMemo(() => {
    if (typeof insights.profile?.followers_count !== 'number') return null
    return formatCompactMetric(insights.profile.followers_count)
  }, [insights.profile])

  const bestReelFormatted = useMemo(() => {
    const views = topReels.reels?.[0]?.insights?.views
    return typeof views === 'number' ? formatCompactMetric(views) : null
  }, [topReels.reels])

  const heroStats = useMemo(() => {
    return h.stats.map((s) => {
      if (s.label === 'Abonnés') {
        return { ...s, value: followersFormatted || <MetricSpinner label="Chargement abonnés" /> }
      }
      if (s.label === 'Vues / 30 jours') {
        const views = insights.metrics30d.views
        return {
          ...s,
          value:
            typeof views === 'number' ? (
              formatCompactMetric(views)
            ) : (
              <MetricSpinner label="Chargement vues 30 jours" />
            ),
        }
      }
      if (s.label === 'Best reel') {
        return { ...s, value: bestReelFormatted || <MetricSpinner label="Chargement best reel" /> }
      }
      return { ...s, value: <MetricSpinner /> }
    })
  }, [h.stats, followersFormatted, insights.metrics30d.views, bestReelFormatted])

  const perfCells = useMemo(() => {
    const metric = (key) =>
      typeof insights.metrics30d[key] === 'number' ? (
        formatCompactMetric(insights.metrics30d[key])
      ) : (
        <MetricSpinner label={`Chargement ${key}`} />
      )

    return [
      {
        featured: true,
        value: metric('views'),
        label: 'Vues totales · 30 derniers jours',
        sub: 'Instagram Graph · metric=views',
      },
      {
        value: metric('reach'),
        label: 'Comptes touchés',
        sub: 'Instagram Graph · metric=reach',
      },
      {
        value: metric('accounts_engaged'),
        label: 'Comptes engagés',
        sub: 'Instagram Graph · metric=accounts_engaged',
      },
      {
        value: metric('total_interactions'),
        label: 'Interactions',
        sub: 'Likes, commentaires, partages, enregistrements',
      },
      {
        value: metric('profile_views'),
        label: 'Vues du profil',
        sub: 'Instagram Graph · metric=profile_views',
      },
      {
        value: followersFormatted || <MetricSpinner label="Chargement abonnés" />,
        label: 'Abonnés',
        sub: 'Champ profil · followers_count',
      },
    ]
  }, [insights.metrics30d, followersFormatted])

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
          metaLastUpdated={refreshedAt}
          kitUpdatedLabel={kitUpdated.label}
          profileErr={insights.error}
          heroStats={heroStats}
          followersFormatted={followersFormatted}
        />

        <main className="mkit-main" id="mkit-main">
          <MediaKitProfile />
          <MediaKitPerformances perfCells={perfCells} />
          <MediaKitReelsTable
            reels={topReels.reels}
            loading={topReels.loading}
            error={topReels.error}
            note={topReels.note}
          />
          <MediaKitAudience
            audience={insights.audience}
            loading={insights.loading}
            error={insights.error}
          />
          <MediaKitContact contact={c} />
        </main>

        <MediaKitFooter year={h.year} metaLastUpdated={refreshedAt} kitUpdatedLabel={kitUpdated.label} />
      </div>
    </div>
  )
}
