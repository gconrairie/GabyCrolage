import fs from 'node:fs/promises'
import path from 'node:path'

const GRAPH = 'https://graph.instagram.com/v21.0'
const STORY_METRICS = [
  'views',
  'reach',
  'replies',
  'shares',
  'total_interactions',
]

function storyStatsFile(statsFile) {
  return (
    statsFile ||
    process.env.IG_STORY_STATS_FILE ||
    path.join(process.cwd(), '.data', 'instagram-story-stats.json')
  )
}

function buildUrl(pathname, params, token) {
  const url = new URL(`${GRAPH}${pathname.startsWith('/') ? pathname : `/${pathname}`}`)
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
  }
  url.searchParams.set('access_token', token)
  return url.toString()
}

async function graphJson(url) {
  const response = await fetch(url)
  const body = await response.json()
  return { ok: response.ok && !body?.error, status: response.status, body }
}

function graphErrorMessage(body, fallback) {
  return body?.error?.message || (body?.error ? JSON.stringify(body.error) : fallback)
}

function parseInsights(body) {
  const out = {}
  if (!Array.isArray(body?.data)) return out
  for (const metric of body.data) {
    const value = metric.values?.[0]?.value
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[metric.name] = value
    }
  }
  return out
}

async function readStore(statsFile) {
  try {
    const raw = await fs.readFile(storyStatsFile(statsFile), 'utf8')
    const parsed = JSON.parse(raw)
    return {
      updatedAt: parsed?.updatedAt || null,
      stories: Array.isArray(parsed?.stories) ? parsed.stories : [],
    }
  } catch {
    return { updatedAt: null, stories: [] }
  }
}

async function writeStore(store, statsFile) {
  const file = storyStatsFile(statsFile)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(store, null, 2))
}

function summarizeStories(stories, days = 30) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const windowStories = stories.filter((story) => {
    const stamp = story.media?.timestamp || story.collectedAt || story.firstCollectedAt
    const time = new Date(stamp).getTime()
    return Number.isFinite(time) && time >= cutoff
  })

  const totals = {}
  for (const metric of STORY_METRICS) totals[metric] = 0

  for (const story of windowStories) {
    for (const metric of STORY_METRICS) {
      const value = story.insights?.[metric]
      if (typeof value === 'number' && Number.isFinite(value)) {
        totals[metric] += value
      }
    }
  }

  return {
    days,
    storyCount: windowStories.length,
    totals,
    from: new Date(cutoff).toISOString(),
    to: new Date().toISOString(),
  }
}

export async function fetchActiveStoryStats({ token, userId }) {
  const storiesUrl = buildUrl(
    `/${userId}/stories`,
    {
      fields: 'id,media_type,media_product_type,permalink,timestamp',
      limit: 50,
    },
    token,
  )
  const storiesRes = await graphJson(storiesUrl)
  if (!storiesRes.ok) {
    throw new Error(graphErrorMessage(storiesRes.body, `HTTP ${storiesRes.status}`))
  }

  const stories = Array.isArray(storiesRes.body?.data) ? storiesRes.body.data : []
  return Promise.all(
    stories.map(async (media) => {
      const insightsUrl = buildUrl(
        `/${media.id}/insights`,
        { metric: STORY_METRICS.join(',') },
        token,
      )
      const insightsRes = await graphJson(insightsUrl)
      if (!insightsRes.ok) {
        return {
          ok: false,
          media,
          insights: {},
          error: graphErrorMessage(insightsRes.body, `HTTP ${insightsRes.status}`),
        }
      }

      return {
        ok: true,
        media,
        insights: parseInsights(insightsRes.body),
      }
    }),
  )
}

export async function collectStoryStats({ token, userId, statsFile }) {
  const collectedAt = new Date().toISOString()
  const activeStories = await fetchActiveStoryStats({ token, userId })
  const store = await readStore(statsFile)
  const byId = new Map(store.stories.map((story) => [story.id, story]))

  for (const story of activeStories) {
    const id = story.media?.id
    if (!id) continue
    const existing = byId.get(id)
    byId.set(id, {
      ...(existing || {}),
      id,
      ok: story.ok,
      media: story.media,
      insights: story.insights,
      error: story.error || null,
      firstCollectedAt: existing?.firstCollectedAt || collectedAt,
      collectedAt,
    })
  }

  const nextStore = {
    updatedAt: collectedAt,
    stories: [...byId.values()].sort((a, b) => {
      const aTime = new Date(a.media?.timestamp || a.collectedAt || 0).getTime()
      const bTime = new Date(b.media?.timestamp || b.collectedAt || 0).getTime()
      return bTime - aTime
    }),
  }
  await writeStore(nextStore, statsFile)

  return {
    collectedAt,
    activeStoryCount: activeStories.length,
    storedStoryCount: nextStore.stories.length,
    activeStories,
    summary30d: summarizeStories(nextStore.stories, 30),
  }
}

export async function readStoryStats({ statsFile, days = 30 }) {
  const store = await readStore(statsFile)
  return {
    updatedAt: store.updatedAt || null,
    storedStoryCount: store.stories.length,
    summary: summarizeStories(store.stories, days),
    stories: store.stories,
  }
}
