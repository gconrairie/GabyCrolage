const GRAPH = 'https://graph.instagram.com/v21.0'

async function graphFetch(path, params, token) {
  const url = new URL(`${GRAPH}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
  }
  url.searchParams.set('access_token', token)

  const response = await fetch(url)
  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = { _nonJson: text.slice(0, 1000) }
  }

  return {
    ok: response.ok && !body?.error,
    status: response.status,
    path,
    params,
    body,
    error: body?.error?.message || null,
  }
}

function publicBody(result) {
  return {
    ok: result.ok,
    status: result.status,
    error: result.error,
    data: result.body?.error ? null : sanitizeGraphBody(result.body),
  }
}

function sanitizeGraphBody(value) {
  if (Array.isArray(value)) return value.map(sanitizeGraphBody)
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value
    if (!value.includes('access_token=')) return value
    try {
      const url = new URL(value)
      url.searchParams.delete('access_token')
      return url.toString()
    } catch {
      return value.replace(/([?&]access_token=)[^&]+/g, '$1[redacted]')
    }
  }

  const out = {}
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'access_token') {
      out[key] = '[redacted]'
    } else {
      out[key] = sanitizeGraphBody(nested)
    }
  }
  return out
}

export async function diagnoseInstagramAccess({ token, userId }) {
  const me = await graphFetch(
    '/me',
    {
      fields: 'user_id,username,account_type,followers_count,media_count',
    },
    token,
  )

  const resolvedUserId = me.body?.user_id || userId
  const profile = await graphFetch(
    `/${resolvedUserId}`,
    {
      fields: 'username,account_type,followers_count,media_count',
    },
    token,
  )

  const accountInsights = await graphFetch(
    `/${resolvedUserId}/insights`,
    {
      metric: 'views',
      period: 'day',
      metric_type: 'total_value',
    },
    token,
  )

  const media = await graphFetch(
    `/${resolvedUserId}/media`,
    {
      fields: 'id,media_type,media_product_type,permalink,timestamp',
      limit: 1,
    },
    token,
  )

  const firstMediaId = Array.isArray(media.body?.data) ? media.body.data[0]?.id : null
  const mediaInsights = firstMediaId
    ? await graphFetch(
        `/${firstMediaId}/insights`,
        {
          metric: 'views',
        },
        token,
      )
    : null

  const missing = []
  if (!me.ok || !profile.ok || !media.ok) {
    missing.push('instagram_business_basic')
  }
  if (!accountInsights.ok || (mediaInsights && !mediaInsights.ok)) {
    missing.push('instagram_business_manage_insights')
  }

  return {
    ok: me.ok && profile.ok && accountInsights.ok && media.ok && (!mediaInsights || mediaInsights.ok),
    userIdConfigured: userId,
    userIdFromToken: me.body?.user_id || null,
    userIdUsed: resolvedUserId,
    checks: {
      me: publicBody(me),
      profile: publicBody(profile),
      accountInsights: publicBody(accountInsights),
      media: publicBody(media),
      mediaInsights: mediaInsights ? publicBody(mediaInsights) : null,
    },
    conclusion: {
      basicAccess: me.ok && profile.ok && media.ok,
      accountInsightsAccess: accountInsights.ok,
      mediaInsightsAccess: mediaInsights ? mediaInsights.ok : null,
      probableMissingPermissions: [...new Set(missing)],
    },
  }
}
