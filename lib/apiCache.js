import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000
const CACHE_FILE =
  process.env.IG_CACHE_FILE ||
  path.join(process.cwd(), '.cache', 'instagram-api-cache.json')

const ttlHours = Number(process.env.IG_CACHE_TTL_HOURS)
export const INSTAGRAM_CACHE_TTL_MS =
  Number.isFinite(ttlHours) && ttlHours > 0
    ? ttlHours * 60 * 60 * 1000
    : DEFAULT_TTL_MS

let cacheLoaded = false
let cacheStore = {}
const inflight = new Map()

function stableStringify(value) {
  if (!value || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`
}

async function loadCache() {
  if (cacheLoaded) return
  cacheLoaded = true
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    cacheStore = parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    cacheStore = {}
  }
}

async function writeCache() {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
  await fs.writeFile(CACHE_FILE, JSON.stringify(cacheStore, null, 2))
}

function cacheMeta(entry, hit) {
  return {
    hit,
    cachedAt: entry.cachedAt,
    expiresAt: new Date(entry.expiresAt).toISOString(),
    ttlHours: INSTAGRAM_CACHE_TTL_MS / (60 * 60 * 1000),
  }
}

export async function cachedResult(keyParts, loader) {
  await loadCache()

  const key = stableStringify(keyParts)
  const now = Date.now()
  const entry = cacheStore[key]

  if (entry && entry.expiresAt > now) {
    return {
      data: entry.data,
      cache: cacheMeta(entry, true),
    }
  }

  if (inflight.has(key)) {
    return inflight.get(key)
  }

  const promise = (async () => {
    const data = await loader()
    const nextEntry = {
      cachedAt: new Date().toISOString(),
      expiresAt: now + INSTAGRAM_CACHE_TTL_MS,
      data,
    }
    cacheStore[key] = nextEntry
    await writeCache()
    return {
      data,
      cache: cacheMeta(nextEntry, false),
    }
  })()

  inflight.set(key, promise)
  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}
