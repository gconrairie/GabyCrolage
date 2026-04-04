import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
              const { fetchProfileSnapshot, fetchReelStats } = await import(
                './lib/instagramEndpoints.js'
              )
              if (action === 'profile') {
                const profile = await fetchProfileSnapshot({ token, userId })
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, profile }))
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
                const data = await fetchReelStats({
                  token,
                  userId,
                  mediaId: mediaInput,
                })
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, ...data }))
                return
              }
              res.statusCode = 400
              res.end(
                JSON.stringify({
                  ok: false,
                  error: 'action invalide (profile | reel).',
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
