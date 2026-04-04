/**
 * Partie décimale après normalisation (arrondi inférieur à 0,01 sur l’échelle).
 */
function formatScaledPart(x) {
  const floored = Math.floor(Number(x) * 100) / 100
  if (!Number.isFinite(floored)) return '—'
  const int = Math.floor(floored)
  const frac = floored - int
  if (frac < 1e-9) {
    return int.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  }
  return floored.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Métriques type compteurs (vues, likes, abonnés…) : format compact 4,51M · 2,40M · 105K,
 * arrondi inférieur à 2 décimales sur la partie significative (M ou K).
 * Sous 1 000 : deux décimales fixes (ex. 842,35).
 */
export function formatCompactMetric(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''

  if (abs >= 1_000_000) {
    const scaled = Math.floor((abs / 1_000_000) * 100) / 100
    return `${sign}${formatScaledPart(scaled)}M`
  }
  if (abs >= 1_000) {
    const scaled = Math.floor((abs / 1_000) * 100) / 100
    return `${sign}${formatScaledPart(scaled)}K`
  }

  const small = Math.floor(abs * 100) / 100
  return (
    sign +
    small.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

/**
 * Pourcentages (audience, barres…) : arrondi inférieur à 2 décimales, sans suffixe M/K.
 */
export function formatPercent2(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const floored = Math.floor(n * 100) / 100
  return floored.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
