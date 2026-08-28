import 'dotenv/config'
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import {
  supabaseAdmin,
  getAgencies,
  getAgencyContext,
  passesCriteria,
  upsertListing,
} from './lib/supabase.mjs'
import * as lbc from './sources/lbc.mjs'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const argAgency = args.find((a) => a.startsWith('--agency='))?.split('=')[1] ?? null

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
const MAX = parseInt(process.env.MAX_ANNONCES_PAR_RUN ?? '15', 10)

async function main() {
  mkdirSync('debug', { recursive: true })
  const sb = supabaseAdmin()
  const agencies = await getAgencies(sb)
  const selected = argAgency
    ? agencies.filter((a) => a.id === argAgency || (a.name ?? '').toLowerCase().includes(argAgency.toLowerCase()))
    : agencies
  if (selected.length === 0) {
    console.log('Aucune agence sélectionnée.')
    return
  }

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    locale: 'fr-FR',
    viewport: { width: 1366, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  try {
    for (const agency of selected) {
      console.log(`\n=== Agence : ${agency.name} (${agency.city}, ${agency.radius_km} km) ===`)
      const criteria = agency.criteria ?? null
      const sources = criteria?.sources ?? ['lbc', 'lacentrale']
      const { contacterColumnId } = await getAgencyContext(sb, agency)

      if (!sources.includes('lbc')) {
        console.log('Source lbc désactivée pour cette agence.')
        continue
      }

      const items = await lbc.scrapeListPage(page, agency)
      console.log(`${items.length} annonce(s) détectée(s) sur la liste.`)

      let processed = 0
      for (const item of items) {
        if (processed >= MAX) {
          console.log(`Plafond MAX_ANNONCES_PAR_RUN=${MAX} atteint, arrêt.`)
          break
        }
        processed++
        try {
          const detail = await lbc.scrapeDetailPage(page, item)
          const ok = passesCriteria(detail, criteria)
          console.log(
            `${ok ? '✔' : '✘ (hors critères)'} ${detail.title ?? detail.source_id} — ${detail.price ?? '?'} € — tél: ${detail.phone_e164 ?? 'non'}`
          )
          if (!ok) continue
          if (dryRun) {
            console.log('   [dry-run] non écrit en base.')
          } else {
            const res = await upsertListing(sb, agency, contacterColumnId, detail)
            console.log(`   → ${res.status} en base (${res.id.slice(0, 8)}…)`)
          }
        } catch (err) {
          console.log(`   Erreur fiche ${item.source_id} : ${err.message}`)
          await page.screenshot({ path: `debug/${item.source_id}.png` }).catch(() => {})
        }
        await delay(rand(5000, 12000)) // cadence humaine
      }
      await delay(rand(6000, 12000))
    }
  } finally {
    await browser.close()
  }
  console.log('\nTerminé.')
}

main().catch((err) => {
  console.error('ERREUR FATALE :', err.message)
  process.exit(1)
})