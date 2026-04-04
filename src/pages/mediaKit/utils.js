/** Formate une date YYYY-MM-DD en libellé français (sans décalage fuseau). */
export function formatMediaKitDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return iso || ''
  const [y, mo, d] = String(iso)
    .split('-')
    .map((n) => parseInt(n, 10))
  return new Date(y, mo - 1, d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Score pour tri décroissant : meilleur reel en premier (vues > interactions totales > likes). */
export function reelRankScore(insights) {
  if (!insights || typeof insights !== 'object') return null
  if (typeof insights.views === 'number') return insights.views
  if (typeof insights.total_interactions === 'number') return insights.total_interactions
  if (typeof insights.likes === 'number') return insights.likes
  return null
}

/** Première ligne de légende pour le titre (API), sinon titre config. */
export function reelDisplayHeadline(caption, titleFallback, maxLen = 72) {
  const raw = caption && String(caption).trim() ? String(caption).split('\n')[0].trim() : ''
  if (!raw) return titleFallback
  return raw.length > maxLen ? `${raw.slice(0, maxLen)}…` : raw
}

/** Sous-titre : type produit + date de publication (API). */
export function formatReelMediaMeta(media) {
  if (!media?.timestamp) return null
  const d = new Date(media.timestamp)
  if (Number.isNaN(d.getTime())) return null
  const dateStr = d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return dateStr
}

/**
 * Fusionne la config (id, title) avec l’état API et trie du meilleur au moins bon.
 * Blocs : reels classables (données ok) → en chargement → erreurs.
 */
export function buildRankedReelRows(reels, reelGrid) {
  const merged = reels.map((r) => {
    const cell = reelGrid[r.id]
    return {
      configId: r.id,
      configTitle: r.title,
      loading: cell?.loading === true,
      error: cell?.error,
      data: cell?.data,
    }
  })

  const rankable = []
  const loading = []
  const errors = []

  for (const row of merged) {
    if (row.loading) {
      loading.push(row)
      continue
    }
    if (row.error) {
      errors.push(row)
      continue
    }
    const insights = row.data?.insights
    const score = reelRankScore(insights)
    if (score !== null && score !== undefined) {
      rankable.push({ ...row, _score: score })
    } else {
      /* Données reçues mais métriques insuffisantes pour classer : dernier bloc avant erreurs */
      rankable.push({ ...row, _score: -1 })
    }
  }

  rankable.sort((a, b) => b._score - a._score)

  return [...rankable, ...loading, ...errors]
}
