/**
 * Appels Instagram Graph (profil, insights média) — utilisé par api/instagram et le dev server Vite.
 */

const GRAPH = 'https://graph.instagram.com/v21.0'

async function graphJson(url) {
  const r = await fetch(url)
  const j = await r.json()
  return { ok: r.ok, status: r.status, body: j }
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
      const msg = body.error
        ? body.error.message || JSON.stringify(body.error)
        : `HTTP ${body}`
      throw new Error(msg)
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
    const msg = metaRes.body.error
      ? metaRes.body.error.message || JSON.stringify(metaRes.body.error)
      : `HTTP ${metaRes.status}`
    throw new Error(msg)
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
