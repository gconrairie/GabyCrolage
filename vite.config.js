import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cachedResult } from './lib/apiCache.js'
import {
  fetchProfileSnapshot,
  fetchReelStats,
  fetchTopReels,
} from './lib/instagramEndpoints.js'
import { diagnoseInstagramAccess } from './lib/instagramDiagnostics.js'
import { fetchInstagramGraphRaw } from './lib/instagramGraphRaw.js'
import {
  collectStoryStats,
  fetchActiveStoryStats,
  readStoryStats,
} from './lib/instagramStories.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-instagram',
        configureServer(server) {
          server.middlewares.use('/api/instagram', async (req, res, next) => {
            if (req.method !== 'GET') return next()
            const url = new URL(req.url || '', 'http://localhost')
            const action = url.searchParams.get('action') || 'profile'
            const mediaInput =
              url.searchParams.get('mediaId') ||
              url.searchParams.get('shortcode')
            const token = env.IG_ACCESS_TOKEN
            const userId = env.IG_USER_ID
            const storyStatsFile = env.IG_STORY_STATS_FILE
            res.setHeader('Content-Type', 'application/json')
            if (!token || !userId) {
              res.statusCode = 503
              res.end(
                JSON.stringify({
                  ok: false,
                  error:
                    'Définir IG_ACCESS_TOKEN et IG_USER_ID dans .env pour le chargement API.',
                }),
              )
              return
            }
            try {
              if (action === 'profile') {
                const { data, cache } = await cachedResult(
                  { scope: 'instagram', userId, action: 'profile' },
                  async () => ({ profile: await fetchProfileSnapshot({ token, userId }) }),
                )
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, ...data, cache }))
                return
              }
              if (action === 'reel' || action === 'media') {
                if (!mediaInput) {
                  res.statusCode = 400
                  res.end(
                    JSON.stringify({
                      ok: false,
                      error:
                        'Paramètre mediaId ou shortcode requis.',
                    }),
                  )
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
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, ...data, cache }))
                return
              }
              if (action === 'top-reels' || action === 'topReels') {
                const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit') || 5) || 5))
                const scanLimit = Math.min(200, Math.max(limit, Number(url.searchParams.get('scanLimit') || 100) || 100))
                const { data, cache } = await cachedResult(
                  { scope: 'instagram', userId, action: 'top-reels', version: 2, limit, scanLimit },
                  async () => ({
                    reels: await fetchTopReels({ token, userId, limit, scanLimit }),
                    note:
                      'Instagram Graph ne fournit pas un classement global direct : classement calculé depuis les reels accessibles via /media sur la profondeur scanLimit.',
                  }),
                )
                res.statusCode = 200
                res.end(
                  JSON.stringify({
                    ok: true,
                    ...data,
                    cache,
                  }),
                )
                return
              }
              if (action === 'diagnose' || action === 'debug') {
                res.statusCode = 200
                res.end(
                  JSON.stringify({
                    ok: true,
                    ...(await diagnoseInstagramAccess({ token, userId })),
                  }),
                )
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
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, ...data, cache }))
                return
              }
              if (action === 'collect-stories') {
                const expectedSecret = env.IG_COLLECT_SECRET
                const givenSecret =
                  url.searchParams.get('secret') || req.headers?.['x-collect-secret']
                if (expectedSecret && givenSecret !== expectedSecret) {
                  res.statusCode = 403
                  res.end(JSON.stringify({ ok: false, error: 'Secret de collecte invalide.' }))
                  return
                }
                res.statusCode = 200
                res.end(
                  JSON.stringify({
                    ok: true,
                    ...(await collectStoryStats({
                      token,
                      userId,
                      statsFile: storyStatsFile,
                    })),
                  }),
                )
                return
              }
              if (action === 'story-stats') {
                const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days') || 30) || 30))
                res.statusCode = 200
                res.end(
                  JSON.stringify({
                    ok: true,
                    ...(await readStoryStats({
                      statsFile: storyStatsFile,
                      days,
                    })),
                  }),
                )
                return
              }
              if (action === 'insights' || action === 'raw') {
                const { data, cache } = await cachedResult(
                  { scope: 'instagram', userId, action: 'insights' },
                  async () => fetchInstagramGraphRaw({ token, userId }),
                )
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, ...data, cache }))
                return
              }
              res.statusCode = 400
              res.end(
                JSON.stringify({
                  ok: false,
                  error:
                    'action invalide (profile | reel | insights | stories | collect-stories | story-stats | diagnose | top-reels).',
                }),
              )
            } catch (e) {
              res.statusCode = 500
              res.end(
                JSON.stringify({
                  ok: false,
                  error: e instanceof Error ? e.message : String(e),
                }),
              )
            }
          })
        },
      },
    ],
  }
})
