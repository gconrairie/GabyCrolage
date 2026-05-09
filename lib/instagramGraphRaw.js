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

function normalizeInsightValue(body) {
  const item = body?.data?.[0]
  if (!item) return { value: null, breakdowns: null, title: '', description: '' }

  if (item.total_value) {
    return {
      value:
        typeof item.total_value.value === 'number'
          ? item.total_value.value
          : null,
      breakdowns: item.total_value.breakdowns || null,
      title: item.title || '',
      description: item.description || '',
    }
  }

  let sum = 0
  let has = false
  if (Array.isArray(item.values)) {
    for (const row of item.values) {
      const v = row.value
      if (typeof v === 'number' && !Number.isNaN(v)) {
        sum += v
        has = true
      }
    }
  }

  return {
    value: has ? sum : null,
    breakdowns: null,
    title: item.title || '',
    description: item.description || '',
  }
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
  ['follower_demographics', 'age'],
  ['follower_demographics', 'gender'],
  ['follower_demographics', 'city'],
  ['follower_demographics', 'country'],
  ['engaged_audience_demographics', 'age'],
  ['engaged_audience_demographics', 'gender'],
  ['engaged_audience_demographics', 'city'],
  ['engaged_audience_demographics', 'country'],
  ['reached_audience_demographics', 'age'],
  ['reached_audience_demographics', 'gender'],
  ['reached_audience_demographics', 'city'],
  ['reached_audience_demographics', 'country'],
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
      metric_type: 'total_value',
      since,
      until,
    }, token)
    return [metric, await graphFetchUrl(url)]
  })
  const dayResults = await Promise.all(dayFetches)

  out.insights_period_day_cumulative_30j = {}
  out.insights_period_day_details = {}
  out.insights_period_day_errors = {}
  for (const [metric, res] of dayResults) {
    const hint = errorHint(res.body)
    if (hint) {
      out.insights_period_day_errors[metric] = hint
      out.insights_period_day_cumulative_30j[metric] = null
      out.insights_period_day_details[metric] = {
        value: null,
        title: '',
        description: '',
        error: hint,
      }
      continue
    }
    const normalized = normalizeInsightValue(res.body)
    out.insights_period_day_cumulative_30j[metric] = normalized.value
    out.insights_period_day_details[metric] = normalized
  }

  const lifeFetches = METRICS_LIFETIME.map(async ([metric, breakdown]) => {
    const url = buildUrl(`/${userId}/insights`, {
      metric,
      period: 'lifetime',
      metric_type: 'total_value',
      breakdown,
    }, token)
    return [`${metric}.${breakdown}`, await graphFetchUrl(url)]
  })
  const lifeResults = await Promise.all(lifeFetches)

  out.insights_period_lifetime_cumulative = {}
  out.insights_period_lifetime_details = {}
  out.insights_period_lifetime_errors = {}
  for (const [key, res] of lifeResults) {
    const hint = errorHint(res.body)
    if (hint) {
      out.insights_period_lifetime_errors[key] = hint
      out.insights_period_lifetime_cumulative[key] = null
      out.insights_period_lifetime_details[key] = {
        value: null,
        breakdowns: null,
        title: '',
        description: '',
        error: hint,
      }
      continue
    }
    const normalized = normalizeInsightValue(res.body)
    out.insights_period_lifetime_cumulative[key] = normalized.value
    out.insights_period_lifetime_details[key] = normalized
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
    items: Array.isArray(items) ? items : [],
    error: errorHint(mediaRes.body),
  }

  return out
}
