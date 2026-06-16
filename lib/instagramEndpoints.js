/**
 * Appels Instagram Graph (profil, insights média) — utilisé par api/instagram et le dev server Vite.
 */

const GRAPH = 'https://graph.instagram.com/v21.0'

async function graphJson(url) {
  const r = await fetch(url)
  const j = await r.json()
  return { ok: r.ok, status: r.status, body: j }
}

function graphErrorMessage(body, fallback) {
  return body?.error?.message || (body?.error ? JSON.stringify(body.error) : fallback)
}

function buildUrl(path, params, token) {
  const u = new URL(`${GRAPH}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v))
  }
  u.searchParams.set('access_token', token)
  return u.toString()
}

/** Champs profil utiles au media kit */
export async function fetchProfileSnapshot({ token, userId }) {
  const url = buildUrl(`/${userId}`, {
    fields: 'followers_count,username,name',
  }, token)
  const { ok, body } = await graphJson(url)
  if (!ok || body.error) {
    const msg = body.error
      ? body.error.message || JSON.stringify(body.error)
      : 'Erreur profil Instagram'
    throw new Error(msg)
  }
  return {
    followers_count: body.followers_count ?? 0,
    username: body.username ?? '',
    name: body.name ?? '',
  }
}

/** Extrait les valeurs numériques lifetime des insights média */
export function parseMediaInsights(body) {
  const out = {}
  if (!body?.data || !Array.isArray(body.data)) return out
  for (const m of body.data) {
    const v = m.values?.[0]?.value
    if (typeof v === 'number' && !Number.isNaN(v)) {
      out[m.name] = v
    }
  }
  return out
}

const REEL_METRICS = [
  'views',
  'reach',
  'likes',
  'comments',
  'saved',
  'shares',
  'total_interactions',
]

/** ID Graph = uniquement des chiffres (souvent 15–20 caractères). */
function isGraphMediaId(s) {
  return /^\d{8,}$/.test(String(s).trim())
}

/**
 * Extrait un shortcode depuis une URL Instagram ou une chaîne brute.
 */
export function parseShortcodeOrId(raw) {
  const t = String(raw || '').trim()
  if (!t) return { kind: 'empty', value: '' }
  if (isGraphMediaId(t)) return { kind: 'id', value: t.trim() }
  const urlM = t.match(/instagram\.com\/(?:reel|p|tv)\/([^/?#]+)/i)
  if (urlM) return { kind: 'shortcode', value: urlM[1] }
  if (/^[A-Za-z0-9_-]+$/.test(t) && t.length >= 5 && t.length <= 32) {
    return { kind: 'shortcode', value: t }
  }
  return { kind: 'unknown', value: t }
}

function permalinkMatchesShortcode(permalink, shortcode) {
  if (!permalink) return false
  try {
    const seg = new URL(permalink).pathname.split('/').filter(Boolean)
    return seg.some((s) => s.toLowerCase() === shortcode.toLowerCase())
  } catch {
    return permalink.toLowerCase().includes(shortcode.toLowerCase())
  }
}

/**
 * Trouve l’ID Graph du média à partir du shortcode (parcours des publications du compte).
 */
export async function findMediaIdByShortcode({ token, userId, shortcode }) {
  const sc = String(shortcode).trim()
  if (!sc) throw new Error('shortcode vide')

  let after = null
  const maxPages = 20

  for (let page = 0; page < maxPages; page++) {
    const params = {
      fields: 'id,permalink',
      limit: '100',
    }
    if (after) params.after = after

    const url = buildUrl(`/${userId}/media`, params, token)
    const { ok, body } = await graphJson(url)

    if (!ok || body.error) {
      throw new Error(graphErrorMessage(body, `HTTP ${body}`))
    }

    const items = body.data || []
    for (const item of items) {
      if (permalinkMatchesShortcode(item.permalink, sc)) {
        return item.id
      }
    }

    after = body.paging?.cursors?.after
    if (!after) break
  }

  throw new Error(
    `Shortcode « ${sc} » introuvable parmi les publications récentes du compte. Utilise l’ID numérique (champ id) depuis l’API Graph, ou vérifie que le reel appartient bien à ce compte.`,
  )
}

/** Résout shortcode / URL → id Graph, ou renvoie l’id tel quel. */
export async function resolveMediaId({ token, userId, raw }) {
  const parsed = parseShortcodeOrId(raw)
  if (parsed.kind === 'empty') throw new Error('Identifiant média requis')
  if (parsed.kind === 'unknown') {
    throw new Error(
      'Format non reconnu : colle l’ID numérique Graph, le shortcode (ex. ABCxyz…), ou l’URL du reel.',
    )
  }
  if (parsed.kind === 'id') return parsed.value
  return findMediaIdByShortcode({ token, userId, shortcode: parsed.value })
}

/**
 * Métadonnées + insights pour un média (reel / vidéo).
 * `mediaId` : ID Graph numérique, shortcode (ex. DTU8uR4DOgh), ou URL instagram.com/reel/…
 */
export async function fetchReelStats({ token, userId, mediaId }) {
  const id = await resolveMediaId({ token, userId, raw: mediaId })

  const metaUrl = buildUrl(`/${id}`, {
    fields:
      'caption,media_type,media_product_type,permalink,timestamp,thumbnail_url',
  }, token)
  const metaRes = await graphJson(metaUrl)
  if (!metaRes.ok || metaRes.body.error) {
    throw new Error(graphErrorMessage(metaRes.body, `HTTP ${metaRes.status}`))
  }
  const media = metaRes.body

  const metricsJoined = REEL_METRICS.join(',')
  const insUrl = buildUrl(`/${id}/insights`, {
    metric: metricsJoined,
  }, token)
  const insRes = await graphJson(insUrl)

  let insights = {}
  let insightsRaw = insRes.body

  if (insRes.ok && !insRes.body.error) {
    insights = parseMediaInsights(insRes.body)
  } else {
    insightsRaw = { _combinedError: insRes.body?.error || insRes.status }
    for (const metric of REEL_METRICS) {
      const one = buildUrl(`/${id}/insights`, { metric }, token)
      const r = await graphJson(one)
      if (r.ok && !r.body.error) {
        Object.assign(insights, parseMediaInsights(r.body))
      }
    }
  }

  return {
    resolvedMediaId: id,
    media,
    insights,
    insightsRaw,
  }
}

async function fetchMediaInsightsById({ token, mediaId }) {
  const metricsJoined = REEL_METRICS.join(',')
  const insUrl = buildUrl(`/${mediaId}/insights`, {
    metric: metricsJoined,
  }, token)
  const insRes = await graphJson(insUrl)

  if (insRes.ok && !insRes.body.error) {
    return parseMediaInsights(insRes.body)
  }

  const insights = {}
  const errors = []
  for (const metric of REEL_METRICS) {
    const one = buildUrl(`/${mediaId}/insights`, { metric }, token)
    const r = await graphJson(one)
    if (r.ok && !r.body.error) {
      Object.assign(insights, parseMediaInsights(r.body))
    } else {
      errors.push(graphErrorMessage(r.body, `HTTP ${r.status}`))
    }
  }
  if (!Object.keys(insights).length && errors.length) {
    throw new Error(errors[0])
  }
  return insights
}

async function fetchRecentReelMedia({ token, userId, limit = 100 }) {
  const reels = []
  let after = null
  const pageLimit = Math.min(100, Math.max(1, limit))
  const maxPages = Math.ceil(limit / pageLimit)

  for (let page = 0; page < maxPages && reels.length < limit; page++) {
    const params = {
      fields:
        'id,caption,media_type,media_product_type,permalink,timestamp,thumbnail_url',
      limit: pageLimit,
    }
    if (after) params.after = after

    const url = buildUrl(`/${userId}/media`, params, token)
    const { ok, body } = await graphJson(url)
    if (!ok || body.error) {
      throw new Error(graphErrorMessage(body, 'Erreur liste médias Instagram'))
    }

    for (const item of body.data || []) {
      if (item.media_product_type === 'REELS' || item.media_type === 'VIDEO') {
        reels.push({
          media: item,
        })
      }
    }

    after = body.paging?.cursors?.after
    if (!after) break
  }

  return reels.slice(0, limit)
}

/**
 * Récupère les reels récents du compte, charge leurs insights, puis renvoie les meilleurs par vues.
 * L’API Graph ne fournit pas directement un classement global « top reels » : on classe donc les reels
 * accessibles via /media sur la profondeur demandée.
 */
export async function fetchTopReels({ token, userId, limit = 5, scanLimit = 100 }) {
  const reelItems = await fetchRecentReelMedia({ token, userId, limit: scanLimit })
  const rows = await Promise.all(
    reelItems.map(async ({ media }) => {
      try {
        const fallbackInsights = await fetchMediaInsightsById({ token, mediaId: media.id })
        return {
          ok: true,
          resolvedMediaId: media.id,
          media,
          insights: fallbackInsights,
        }
      } catch (e) {
        return {
          ok: false,
          resolvedMediaId: media.id,
          media,
          insights: {},
          error: e instanceof Error ? e.message : String(e),
        }
      }
    }),
  )

  return rows
    .sort((a, b) => {
      const aViews = typeof a.insights?.views === 'number' ? a.insights.views : -1
      const bViews = typeof b.insights?.views === 'number' ? b.insights.views : -1
      return bViews - aViews
    })
    .slice(0, limit)
}
