import { URL } from 'node:url'
import {
  fetchProfileSnapshot,
  fetchReelStats,
} from '../lib/instagramEndpoints.js'

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
        'Variables IG_ACCESS_TOKEN et IG_USER_ID requises (ex. secrets Vercel).',
    })
    return
  }

  const q = readQuery(req)
  const action = q.action || 'profile'
  const mediaInput = q.mediaId || q.media_id || q.shortcode

  try {
    if (action === 'profile') {
      const profile = await fetchProfileSnapshot({ token, userId })
      sendJson(res, 200, { ok: true, profile })
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
      const data = await fetchReelStats({
        token,
        userId,
        mediaId: mediaInput,
      })
      sendJson(res, 200, { ok: true, ...data })
      return
    }

    sendJson(res, 400, {
      ok: false,
      error: 'action inconnue. Utiliser profile ou reel&mediaId=…',
    })
  } catch (e) {
    sendJson(res, 500, {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    })
  }
}
