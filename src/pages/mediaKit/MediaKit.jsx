import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faFilePdf, faGlobe } from '@fortawesome/free-solid-svg-icons'
import '../MediaKit.css'
import { MEDIA_KIT } from './data'
import translations from './translations.json'
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

const LANGUAGE_STORAGE_KEY = 'mediaKitLanguage'
const LOCALES = {
  fr: 'fr-FR',
  en: 'en-US',
}
const LANGUAGES = ['fr', 'en']

function initialLanguage() {
  if (typeof window === 'undefined') return 'fr'
  const params = new URLSearchParams(window.location.search)
  const queryLang = params.get('lang')?.toLowerCase()
  if (LANGUAGES.includes(queryLang)) return queryLang

  const storedLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return LANGUAGES.includes(storedLang) ? storedLang : 'fr'
}

export default function MediaKit() {
  const [language, setLanguage] = useState(initialLanguage)
  const copy = translations[language] || translations.fr
  const locale = LOCALES[language] || LOCALES.fr
  const h = copy.hero
  const c = MEDIA_KIT.contact

  const insights = useInstagramInsights(language)
  const topReels = useTopInstagramReels()
  const refreshedAt = insights.data?.cache?.cachedAt || insights.data?.fetchedAt || ''
  const kitUpdated = formatMediaKitDateTime(refreshedAt, locale)

  const followersFormatted = useMemo(() => {
    if (typeof insights.profile?.followers_count !== 'number') return null
    return formatCompactMetric(insights.profile.followers_count, locale)
  }, [insights.profile, locale])

  const bestReelFormatted = useMemo(() => {
    const views = topReels.reels?.[0]?.insights?.views
    return typeof views === 'number' ? formatCompactMetric(views, locale) : null
  }, [topReels.reels, locale])

  const heroStats = useMemo(() => {
    return h.stats.map((s) => {
      if (s.key === 'followers') {
        return { ...s, value: followersFormatted || <MetricSpinner label={copy.loading.followers} /> }
      }
      if (s.key === 'views30d') {
        const views = insights.metrics30d.views
        return {
          ...s,
          value:
            typeof views === 'number' ? (
              formatCompactMetric(views, locale)
            ) : (
              <MetricSpinner label={copy.loading.views30d} />
            ),
        }
      }
      if (s.key === 'bestReel') {
        return { ...s, value: bestReelFormatted || <MetricSpinner label={copy.loading.bestReel} /> }
      }
      return { ...s, value: <MetricSpinner /> }
    })
  }, [h.stats, followersFormatted, insights.metrics30d.views, bestReelFormatted, copy.loading, locale])

  const perfCells = useMemo(() => {
    const metric = (key) =>
      typeof insights.metrics30d[key] === 'number' ? (
        formatCompactMetric(insights.metrics30d[key], locale)
      ) : (
        <MetricSpinner label={`${copy.loading.metric} ${key}`} />
      )
    const labels = copy.performances.metrics

    return [
      {
        featured: true,
        value: metric('views'),
        label: labels.views.label,
        sub: labels.views.sub,
      },
      {
        value: metric('reach'),
        label: labels.reach.label,
        sub: labels.reach.sub,
      },
      {
        value: metric('accounts_engaged'),
        label: labels.accounts_engaged.label,
        sub: labels.accounts_engaged.sub,
      },
      {
        value: metric('total_interactions'),
        label: labels.total_interactions.label,
        sub: labels.total_interactions.sub,
      },
      {
        value: metric('profile_views'),
        label: labels.profile_views.label,
        sub: labels.profile_views.sub,
      },
      {
        value: followersFormatted || <MetricSpinner label={copy.loading.followers} />,
        label: labels.followers.label,
        sub: labels.followers.sub,
      },
    ]
  }, [insights.metrics30d, followersFormatted, copy.performances.metrics, copy.loading, locale])

  useEffect(() => {
    document.title = copy.documentTitle
    document.documentElement.lang = language
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    const metaRobots = document.createElement('meta')
    metaRobots.name = 'robots'
    metaRobots.content = 'noindex, nofollow, noarchive'
    document.head.appendChild(metaRobots)
    return () => {
      document.head.removeChild(metaRobots)
    }
  }, [copy.documentTitle, language])

  const handlePdfExport = () => {
    window.print()
  }

  return (
    <div className="mkit">
      <a href="#mkit-main" className="mkit-skip">
        {copy.skipLink}
      </a>

      <div className="mkit-frame">

        <nav className="mkit-back flex items-center justify-between" aria-label={copy.nav.ariaLabel}>
          <Link to="/" className="mkit-back__link">
            <FontAwesomeIcon icon={faArrowLeft} className="mkit-back__icon" aria-hidden />
            <span>{copy.nav.home}</span>
          </Link>

          <div className="langs flex items-center gap-3 text-sm" aria-label={copy.nav.languageLabel}>
            <button
              type="button"
              className={`cursor-pointer ${language === 'fr' ? 'text-accent font-semibold' : 'text-slate-600'}`}
              aria-pressed={language === 'fr'}
              title={`${copy.nav.languageTitle}: FR`}
              onClick={() => setLanguage('fr')}
            >
              FR
            </button>
            <div className="text-slate-800">|</div>
            <button
              type="button"
              className={`cursor-pointer ${language === 'en' ? 'text-accent font-semibold' : 'text-slate-600'}`}
              aria-pressed={language === 'en'}
              title={`${copy.nav.languageTitle}: EN`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
          </div>

        </nav>
        <MediaKitCover
          hero={h}
          metaLastUpdated={refreshedAt}
          kitUpdatedLabel={kitUpdated.label}
          profileErr={insights.error}
          heroStats={heroStats}
        />

        <main className="mkit-main" id="mkit-main">
          <MediaKitProfile copy={copy.profile} />
          <MediaKitPerformances perfCells={perfCells} copy={copy.performances} />
          <MediaKitReelsTable
            reels={topReels.reels}
            loading={topReels.loading}
            error={topReels.error}
            note={topReels.note}
            copy={{ ...copy.reels, loading: copy.loading }}
            locale={locale}
          />
          <MediaKitAudience
            audience={insights.audience}
            loading={insights.loading}
            error={insights.error}
            copy={{
              ...copy.audience,
              loading: {
                age: copy.loading.audienceAge,
                men: copy.loading.audienceMen,
                women: copy.loading.audienceWomen,
                cities: copy.loading.cities,
                countries: copy.loading.countries,
                insight: copy.loading.audienceInsight,
              },
            }}
            locale={locale}
          />
          <MediaKitContact contact={c} copy={copy.contact} />

          <div className="mkit-export" aria-label={copy.export.ariaLabel}>
            <button type="button" className="mkit-export__btn" onClick={handlePdfExport}>
              <FontAwesomeIcon icon={faFilePdf} className="mkit-export__icon" aria-hidden />
              <span>{copy.export.button}</span>
            </button>
          </div>

        </main>


        <MediaKitFooter
          year={h.year}
          metaLastUpdated={refreshedAt}
          kitUpdatedLabel={kitUpdated.label}
          copy={copy.footer}
        />

      </div>
    </div>
  )
}
