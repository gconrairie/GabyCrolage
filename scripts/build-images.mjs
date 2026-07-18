import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const srcDir = path.join(root, 'assets', 'images')
const outDir = path.join(root, 'public', 'assets', 'images')

const variants = [256, 480, 512, 768, 1024, 1280]
const base = 'gabycrolage'

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

async function fileExists(p) {
  try {
    await fs.stat(p)
    return true
  } catch {
    return false
  }
}

async function findSourceWebp(w) {
  const sources = [
    path.join(srcDir, `${base}-${w}w.webp`),
    path.join(outDir, `${base}-${w}w.webp`),
  ]

  for (const source of sources) {
    if (await fileExists(source)) return source
  }

  throw new Error(`Image source manquante: assets/images/${base}-${w}w.webp ou public/assets/images/${base}-${w}w.webp`)
}

async function main() {
  await ensureDir(outDir)

  const tasks = variants.map(async (w) => {
    const srcWebp = await findSourceWebp(w)
    const outWebp = path.join(outDir, `${base}-${w}w.webp`)
    const outAvif = path.join(outDir, `${base}-${w}w.avif`)

    // Copie webp pour servir en statique en prod (/assets/images/…)
    if (srcWebp !== outWebp) {
      await fs.copyFile(srcWebp, outWebp)
    }

    // Génère AVIF (si non présent ou source plus récente)
    const [srcStat, avifStat] = await Promise.all([
      fs.stat(srcWebp),
      fs.stat(outAvif).catch(() => null),
    ])
    if (!avifStat || srcStat.mtimeMs > avifStat.mtimeMs) {
      await sharp(srcWebp)
        .avif({ quality: 55, effort: 6 })
        .toFile(outAvif)
    }
  })

  await Promise.all(tasks)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
