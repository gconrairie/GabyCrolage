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

function countryLabel(code) {
  return COUNTRY_NAMES[code] || code
}

function buildAudience(details) {
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
      `la tranche ${topAge.label} est la plus représentée (${topAge.pct.toLocaleString('fr-FR', {
        maximumFractionDigits: 1,
      })}%)`,
    )
  }
  if (france) {
    insightParts.push(
      `la France concentre ${france.pct.toLocaleString('fr-FR', {
        maximumFractionDigits: 1,
      })}% des followers renseignés`,
    )
  }

  return {
    age,
    gender,
    cities,
    countries: countries.map((row) => ({ ...row, label: countryLabel(row.label) })),
    insight: insightParts.length
      ? `${insightParts.join(' et ')}.`
      : 'Les données démographiques disponibles viennent directement des répartitions Instagram Graph.',
  }
}

export function useInstagramInsights() {
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
      audience: buildAudience(details),
    }
  }, [state])
}
