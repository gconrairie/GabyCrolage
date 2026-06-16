import { URL } from 'node:url'
import {
  fetchProfileSnapshot,
  fetchReelStats,
  fetchTopReels,
} from '../lib/instagramEndpoints.js'
import { fetchInstagramGraphRaw } from '../lib/instagramGraphRaw.js'
import { diagnoseInstagramAccess } from '../lib/instagramDiagnostics.js'
import {
  collectStoryStats,
  fetchActiveStoryStats,
  readStoryStats,
} from '../lib/instagramStories.js'
import { cachedResult } from '../lib/apiCache.js'

function readQuery(req) {
  if (req.query && Object.keys(req.query).length) return req.query
  try {
    const u = new URL(req.url || '', 'http://localhost')
    const q = {}
    u.searchParams.forEach((v, k) => {
      q[k] = v
    })
    return q
  } catch {
    return {}
  }
}

function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(obj))
}

function canCollectStories(req, q) {
  const expected = process.env.IG_COLLECT_SECRET
  if (!expected) return true
  return q.secret === expected || req.headers?.['x-collect-secret'] === expected
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  const token = process.env.IG_ACCESS_TOKEN
  const userId = process.env.IG_USER_ID

  if (!token || !userId) {
    sendJson(res, 500, {
      ok: false,
      error:
        'Variables IG_ACCESS_TOKEN et IG_USER_ID requises.',
    })
    return
  }

  const q = readQuery(req)
  const action = q.action || 'profile'
  const mediaInput = q.mediaId || q.media_id || q.shortcode

  try {
    if (action === 'profile') {
      const { data, cache } = await cachedResult(
        { scope: 'instagram', userId, action: 'profile' },
        async () => ({ profile: await fetchProfileSnapshot({ token, userId }) }),
      )
      sendJson(res, 200, { ok: true, ...data, cache })
      return
    }

    if (action === 'reel' || action === 'media') {
      if (!mediaInput) {
        sendJson(res, 400, {
          ok: false,
          error:
            'Paramètre requis : mediaId (ID Graph), shortcode, ou URL du reel.',
        })
        return
      }
      const { data, cache } = await cachedResult(
        { scope: 'instagram', userId, action: 'reel', mediaInput },
        async () =>
          fetchReelStats({
            token,
            userId,
            mediaId: mediaInput,
          }),
      )
      sendJson(res, 200, { ok: true, ...data, cache })
      return
    }

    if (action === 'insights' || action === 'raw') {
      const { data, cache } = await cachedResult(
        { scope: 'instagram', userId, action: 'insights' },
        async () => fetchInstagramGraphRaw({ token, userId }),
      )
      sendJson(res, 200, { ok: true, ...data, cache })
      return
    }

    if (action === 'diagnose' || action === 'debug') {
      sendJson(res, 200, {
        ok: true,
        ...(await diagnoseInstagramAccess({ token, userId })),
      })
      return
    }

    if (action === 'stories') {
      const { data, cache } = await cachedResult(
        { scope: 'instagram', userId, action: 'stories', version: 1 },
        async () => ({
          stories: await fetchActiveStoryStats({ token, userId }),
          note:
            'Instagram Graph ne renvoie que les stories actives. Pour un KPI 30 jours, utiliser collect-stories quotidiennement.',
        }),
      )
      sendJson(res, 200, { ok: true, ...data, cache })
      return
    }

    if (action === 'collect-stories') {
      if (!canCollectStories(req, q)) {
        sendJson(res, 403, { ok: false, error: 'Secret de collecte invalide.' })
        return
      }
      sendJson(res, 200, {
        ok: true,
        ...(await collectStoryStats({
          token,
          userId,
          statsFile: process.env.IG_STORY_STATS_FILE,
        })),
      })
      return
    }

    if (action === 'story-stats') {
      const days = Math.min(90, Math.max(1, Number(q.days || 30) || 30))
      sendJson(res, 200, {
        ok: true,
        ...(await readStoryStats({
          statsFile: process.env.IG_STORY_STATS_FILE,
          days,
        })),
      })
      return
    }

    if (action === 'top-reels' || action === 'topReels') {
      const limit = Math.min(10, Math.max(1, Number(q.limit || 5) || 5))
      const scanLimit = Math.min(200, Math.max(limit, Number(q.scanLimit || 100) || 100))
      const { data, cache } = await cachedResult(
        { scope: 'instagram', userId, action: 'top-reels', version: 2, limit, scanLimit },
        async () => ({
          reels: await fetchTopReels({ token, userId, limit, scanLimit }),
          note:
            'Instagram Graph ne fournit pas un classement global direct : classement calculé depuis les reels accessibles via /media sur la profondeur scanLimit.',
        }),
      )
      sendJson(res, 200, {
        ok: true,
        ...data,
        cache,
      })
      return
    }

    sendJson(res, 400, {
      ok: false,
      error:
        'action inconnue. Utiliser profile, reel&mediaId=…, insights, stories, collect-stories, story-stats, diagnose ou top-reels',
    })
  } catch (e) {
    sendJson(res, 500, {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    })
  }
}
