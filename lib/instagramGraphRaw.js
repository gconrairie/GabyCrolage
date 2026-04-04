/**
 * Appels Instagram Graph API — sortie limitée aux totaux cumulés
 * (somme des valeurs journalières sur la fenêtre since/until pour period=day).
 */

const GRAPH = 'https://graph.instagram.com/v21.0'

async function graphFetchUrl(url) {
  const r = await fetch(url)
  const text = await r.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = { _nonJson: text.slice(0, 8000) }
  }
  return { status: r.status, ok: r.ok, body }
}

function buildUrl(path, params, token) {
  const u = new URL(`${GRAPH}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v))
  }
  u.searchParams.set('access_token', token)
  return u.toString()
}

/** Somme des `value` numériques dans `data[].values[]` (métriques jour). */
function cumulativeSumDayInsight(body) {
  if (!body?.data || !Array.isArray(body.data)) return null
  let sum = 0
  let has = false
  for (const series of body.data) {
    if (!Array.isArray(series.values)) continue
    for (const row of series.values) {
      const v = row.value
      if (typeof v === 'number' && !Number.isNaN(v)) {
        sum += v
        has = true
      }
    }
  }
  return has ? sum : null
}

/**
 * Lifetime : souvent une seule valeur (nombre ou objet de répartition).
 * Si nombre → renvoyé tel quel. Si objet à valeurs numériques → somme (ex. comptes par segment).
 */
function cumulativeOrSnapshotLifetime(body) {
  if (!body?.data?.[0]?.values?.[0]) return null
  const v = body.data[0].values[0].value
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const nums = Object.values(v).filter(
      (x) => typeof x === 'number' && !Number.isNaN(x),
    )
    if (nums.length === 0) return null
    const s = nums.reduce((a, b) => a + b, 0)
    // Si ça ressemble à des parts (somme ~ 1), ne pas présenter comme « total cumulé » unique
    if (s > 0.5 && s < 1.5 && nums.length > 2) return null
    return s
  }
  return null
}

function errorHint(body) {
  if (!body?.error) return null
  const e = body.error
  if (typeof e === 'string') return e
  return e.message || e.type || JSON.stringify(e)
}

const METRICS_DAY = [
  'reach',
  'views',
  'profile_views',
  'accounts_engaged',
  'total_interactions',
  'likes',
  'comments',
  'shares',
  'saves',
  'replies',
  'website_clicks',
  'profile_links_taps',
  'content_views',
  'follows_and_unfollows',
  'follower_count',
  'online_followers',
]

const METRICS_LIFETIME = [
  'audience_gender_age',
  'audience_city',
  'audience_country',
  'engaged_audience_demographics',
  'reached_audience_demographics',
  'follower_demographics',
]

/**
 * @param {{ token: string, userId: string }} opts
 * @returns {Promise<Record<string, unknown>>}
 */
export async function fetchInstagramGraphRaw({ token, userId }) {
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
  const until = Math.floor(Date.now() / 1000)

  const out = {
    fetchedAt: new Date().toISOString(),
    window: {
      sinceUnix: since,
      untilUnix: until,
      label:
        'Somme des valeurs journalières (period=day) sur cette fenêtre — équivalent « cumul 30 j » pour les compteurs jour.',
    },
  }

  const userRes = await graphFetchUrl(
    buildUrl(`/${userId}`, {
      fields:
        'name,username,profile_picture_url,followers_count,follows_count,media_count,biography,website',
    }, token),
  )
  out.user = {
    httpStatus: userRes.status,
    ok: userRes.ok,
    profile: userRes.body?.error ? null : userRes.body,
    error: errorHint(userRes.body),
  }

  const dayFetches = METRICS_DAY.map(async (metric) => {
    const url = buildUrl(`/${userId}/insights`, {
      metric,
      period: 'day',
      since,
      until,
    }, token)
    return [metric, await graphFetchUrl(url)]
  })
  const dayResults = await Promise.all(dayFetches)

  out.insights_period_day_cumulative_30j = {}
  out.insights_period_day_errors = {}
  for (const [metric, res] of dayResults) {
    const hint = errorHint(res.body)
    if (hint) {
      out.insights_period_day_errors[metric] = hint
      out.insights_period_day_cumulative_30j[metric] = null
      continue
    }
    out.insights_period_day_cumulative_30j[metric] = cumulativeSumDayInsight(
      res.body,
    )
  }

  const lifeFetches = METRICS_LIFETIME.map(async (metric) => {
    const url = buildUrl(`/${userId}/insights`, {
      metric,
      period: 'lifetime',
    }, token)
    return [metric, await graphFetchUrl(url)]
  })
  const lifeResults = await Promise.all(lifeFetches)

  out.insights_period_lifetime_cumulative = {}
  out.insights_period_lifetime_errors = {}
  for (const [metric, res] of lifeResults) {
    const hint = errorHint(res.body)
    if (hint) {
      out.insights_period_lifetime_errors[metric] = hint
      out.insights_period_lifetime_cumulative[metric] = null
      continue
    }
    out.insights_period_lifetime_cumulative[metric] =
      cumulativeOrSnapshotLifetime(res.body)
  }

  const mediaRes = await graphFetchUrl(
    buildUrl(`/${userId}/media`, {
      fields: 'id,caption,media_type,media_product_type,timestamp,permalink',
      limit: 25,
    }, token),
  )
  const items = mediaRes.body?.data
  out.media_first_page = {
    httpStatus: mediaRes.status,
    ok: mediaRes.ok,
    itemsCount: Array.isArray(items) ? items.length : 0,
    error: errorHint(mediaRes.body),
  }

  return out
}
