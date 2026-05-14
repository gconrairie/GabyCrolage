import { useEffect, useMemo, useState } from 'react'

const FRENCH_CITY_MARKERS = [
  'Alsace',
  'Aquitaine',
  'Auvergne',
  'Bourgogne',
  'Bretagne',
  'Centre',
  'Champagne-Ardenne',
  'Corse',
  'Franche-Comté',
  'Île-de-France',
  'Languedoc-Roussillon',
  'Limousin',
  'Lorraine',
  'Midi-Pyrénées',
  'Nord-Pas-de-Calais',
  'Normandie',
  'Pays de la Loire',
  'Picardie',
  'Poitou-Charentes',
  'Provence-Alpes-Côte d’Azur',
  "Provence-Alpes-Côte d'Azur",
  'Rhône-Alpes',
]

const COUNTRY_NAMES = {
  fr: {
    FR: 'France',
    US: 'États-Unis',
    DE: 'Allemagne',
    GB: 'Royaume-Uni',
    BE: 'Belgique',
    CA: 'Canada',
    ES: 'Espagne',
    IT: 'Italie',
    CH: 'Suisse',
    NL: 'Pays-Bas',
    AU: 'Australie',
    TR: 'Turquie',
  },
  en: {
    FR: 'France',
    US: 'United States',
    DE: 'Germany',
    GB: 'United Kingdom',
    BE: 'Belgium',
    CA: 'Canada',
    ES: 'Spain',
    IT: 'Italy',
    CH: 'Switzerland',
    NL: 'Netherlands',
    AU: 'Australia',
    TR: 'Turkey',
  },
}

const AUDIENCE_INSIGHT_COPY = {
  fr: {
    conjunction: ' et ',
    age: (label, pct) => `la tranche ${label} est la plus représentée (${pct}%)`,
    france: (pct) => `la France concentre ${pct}% des followers renseignés`,
    fallback:
      'Les données démographiques disponibles viennent directement des répartitions Instagram Graph.',
  },
  en: {
    conjunction: ' and ',
    age: (label, pct) => `${label} is the most represented age group (${pct}%)`,
    france: (pct) => `France accounts for ${pct}% of identified followers`,
    fallback:
      'The available demographic data comes directly from Instagram Graph breakdowns.',
  },
}

function breakdownResults(detail) {
  const first = detail?.breakdowns?.[0]
  return Array.isArray(first?.results) ? first.results : []
}

function toDistribution(detail, options = {}) {
  const rows = breakdownResults(detail)
    .map((row) => ({
      label: row.dimension_values?.[0] || 'Non renseigné',
      value: Number(row.value) || 0,
    }))
    .filter((row) => row.value > 0)

  const total = options.total || rows.reduce((sum, row) => sum + row.value, 0)
  return rows
    .map((row) => ({
      ...row,
      pct: total > 0 ? (row.value / total) * 100 : 0,
      width: total > 0 ? `${Math.max(2, (row.value / Math.max(...rows.map((r) => r.value))) * 100)}%` : '0%',
    }))
    .sort((a, b) => b.value - a.value)
}

function isFrenchCity(label) {
  return FRENCH_CITY_MARKERS.some((marker) => label.includes(marker))
}

function cityName(label) {
  return String(label).split(',')[0].trim()
}

function countryLabel(code, language) {
  return COUNTRY_NAMES[language]?.[code] || code
}

function buildAudience(details, language) {
  const insightCopy = AUDIENCE_INSIGHT_COPY[language] || AUDIENCE_INSIGHT_COPY.fr
  const locale = language === 'en' ? 'en-US' : 'fr-FR'
  const age = toDistribution(details?.['follower_demographics.age']).sort((a, b) => {
    const order = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
    return order.indexOf(a.label) - order.indexOf(b.label)
  })
  const gender = toDistribution(details?.['follower_demographics.gender'])
  const countries = toDistribution(details?.['follower_demographics.country']).slice(0, 8)
  const france = countries.find((row) => row.label === 'FR')
  const cities = toDistribution(details?.['follower_demographics.city'])
    .filter((row) => isFrenchCity(row.label))
    .map((row) => ({ ...row, label: cityName(row.label) }))
    .slice(0, 5)

  const topAge = [...age].sort((a, b) => b.value - a.value)[0]
  const insightParts = []
  if (topAge) {
    insightParts.push(
      insightCopy.age(topAge.label, topAge.pct.toLocaleString(locale, {
        maximumFractionDigits: 1,
      })),
    )
  }
  if (france) {
    insightParts.push(
      insightCopy.france(france.pct.toLocaleString(locale, {
        maximumFractionDigits: 1,
      })),
    )
  }

  return {
    age,
    gender,
    cities,
    countries: countries.map((row) => ({ ...row, label: countryLabel(row.label, language) })),
    insight: insightParts.length
      ? `${insightParts.join(insightCopy.conjunction)}.`
      : insightCopy.fallback,
  }
}

export function useInstagramInsights(language = 'fr') {
  const [state, setState] = useState({ loading: true, data: null, error: null })

  useEffect(() => {
    let cancelled = false
    fetch('/api/instagram?action=insights')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (!j.ok) {
          setState({ loading: false, data: null, error: j.error || 'Insights indisponibles' })
          return
        }
        setState({ loading: false, data: j, error: null })
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, data: null, error: 'API indisponible' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(() => {
    const details = state.data?.insights_period_lifetime_details || {}
    return {
      ...state,
      profile: state.data?.user?.profile || null,
      metrics30d: state.data?.insights_period_day_cumulative_30j || {},
      metricDetails30d: state.data?.insights_period_day_details || {},
      audience: buildAudience(details, language),
    }
  }, [state, language])
}
