// Scraper leboncoin — mode humain, parsing défensif, dumps de calibration.
export const SOURCE = 'lbc'

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

let dumpedCard = false
let dumpedDetail = false

export function buildSearchUrl(agency) {
  const city = encodeURIComponent((agency.city ?? '').trim())
  const cp = (agency.postal_code ?? '').trim()
  const radius = agency.radius_km ?? 20
  const params = new URLSearchParams()
  params.set('category', '2') // voitures
  params.set('locations', `${city}_${cp}_${radius}`)
  params.set('sort', 'date')
  return `https://www.leboncoin.fr/recherche?${params.toString()}`
}

function parsePrice(text) {
  const m = (text ?? '').match(/([\d\s]{2,})\s*€/)
  if (!m) return null
  const n = parseInt(m[1].replace(/\s/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

function parseCityZip(text) {
  const m = (text ?? '').match(/([A-Za-zÀ-ÿ' -]{2,})\s*(\d{5})/)
  if (!m) return { city: null, postal_code: null }
  return { city: m[1].trim(), postal_code: m[2] }
}

function parsePublished(text, now) {
  const t = (text ?? '').toLowerCase()
  if (t.includes("aujourd'hui")) return now
  if (t.includes('hier')) return new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const m = t.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00`).toISOString()
  return now
}

async function waitForHuman(page, message) {
  console.log(`\n⚠️ ${message}\n   Résolvez dans la fenêtre du navigateur, puis appuyez sur Entrée ici.`)
  const readline = await import('readline')
  const rl = readline.createInterface({ input: process.stdin })
  await new Promise((r) =>
    rl.question('', () => {
      rl.close()
      r()
    })
  )
}

export async function detectCaptcha(page) {
  const body = (await page.textContent('body').catch(() => '')) ?? ''
  return /vérifions|captcha|robot|sécurité inhabituelle/i.test(body)
}

async function dumpPage(page, path) {
  try {
    const { writeFileSync } = await import('fs')
    const html = await page.content()
    writeFileSync(path, html.slice(0, 400000))
    console.log(`   [debug] HTML sauvé : ${path}`)
  } catch {
    // jamais bloquant
  }
}

export async function scrapeListPage(page, agency) {
  const url = buildSearchUrl(agency)
  console.log(`→ Ouverture ${url}`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await delay(rand(3000, 6000))

  if (await detectCaptcha(page)) {
    await waitForHuman(page, 'CAPTCHA leboncoin détecté.')
    await delay(2000)
  }
  await dumpPage(page, 'debug/liste-brute.html')

  const cards = await page
    .locator('article, div[data-qa-id="listing"], a[href*="/ad/"]')
    .all()

  const items = []
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    try {
      const d = await card.evaluate((el) => {
        const clone = el.cloneNode(true)
        clone.querySelectorAll('style, script').forEach((n) => n.remove())
        const text = (clone.textContent || '').replace(/\s+/g, ' ').trim()
        const a =
          el.querySelector('a[href*="/ad/"], a[href*="/voitures/"]') ||
          el.closest('a') ||
          el.querySelector('a')
        const img = el.querySelector('img')
        const t = el.querySelector(
          '[data-qa-id="listing_title"], h3, [class*="title" i]'
        )
        return {
          href: a ? a.href : null,
          titleA: a
            ? a.getAttribute('title') || a.getAttribute('aria-label')
            : null,
          titleT: t ? t.textContent.trim() : null,
          img: img
            ? img.getAttribute('src') || img.getAttribute('data-src')
            : null,
          text,
        }
      })
      if (!d) continue

      const idMatch = (d.href ?? '').match(/\/(\d{6,})/)
      if (!idMatch) continue
      const sourceId = idMatch[1]
      if (items.some((x) => x.source_id === sourceId)) continue

      if (!dumpedCard) {
        try {
          const { writeFileSync } = await import('fs')
          writeFileSync('debug/carte-brute.html', (await card.innerHTML()).slice(0, 100000))
          dumpedCard = true
        } catch {}
      }

      const beforePrice = (d.text.split(/[\d\s]{2,}€/)[0] ?? '').trim()
      const { city, postal_code } = parseCityZip(d.text)

      items.push({
        source: 'lbc',
        source_id: sourceId,
        url: d.href,
        title: d.titleT || d.titleA || beforePrice || null,
        photo_url: d.img ?? null,
        city,
        postal_code,
        price: parsePrice(d.text),
        published_at: parsePublished(d.text, new Date().toISOString()),
      })
    } catch {
      // carte illisible : on passe
    }
  }
  return items
}

export async function scrapeDetailPage(page, item) {
  await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await delay(rand(2500, 5000))

  if (await detectCaptcha(page)) {
    await waitForHuman(page, 'CAPTCHA leboncoin sur la fiche.')
    await delay(2000)
  }
  if (!dumpedDetail) {
    await dumpPage(page, `debug/fiche-${item.source_id}.html`)
    dumpedDetail = true
  }

  // Extraction clé/valeur défensive (listes, dl/dt/dd, paires "Clé : valeur")
  const specs = await page.evaluate(() => {
    const map = {}
    document.querySelectorAll('li, dl div, dt').forEach((el) => {
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim()
      const m = txt.match(/^([^:]{2,40})\s*:\s*(.+)$/)
      if (m) map[m[1].toLowerCase()] = m[2]
      if (el.tagName === 'DT' && el.nextElementSibling) {
        map[txt.toLowerCase()] = (el.nextElementSibling.textContent || '').trim()
      }
    })
    const body = (document.body.textContent || '').replace(/\s+/g, ' ')
    return { map, body }
  })

  const get = (...keys) => {
    for (const k of keys) {
      const v = specs.map[k.toLowerCase()]
      if (v) return v
    }
    return null
  }

  const out = { ...item }

  const yearTxt =
    get('année', 'annee', 'mise en circulation') ||
    (specs.body.match(/(?:mise en circulation|année)\D{0,6}((?:19|20)\d{2})/i) || [])[1]
  out.year = yearTxt
    ? parseInt((yearTxt.match(/(19|20)\d{2}/) || [])[0] ?? '', 10) || null
    : null

  const kmTxt =
    get('kilométrage', 'kilometrage') ||
    (specs.body.match(/([\d\s]{2,})\s*km/) || [])[1]
  out.mileage = kmTxt ? parseInt(kmTxt.replace(/\s/g, ''), 10) || null : null

  out.fuel =
    get('carburant', 'énergie', 'energie') ||
    (/Essence/i.test(specs.body)
      ? 'Essence'
      : /Diesel/i.test(specs.body)
        ? 'Diesel'
        : /Électrique|Electrique/i.test(specs.body)
          ? 'Électrique'
          : /Hybride/i.test(specs.body)
            ? 'Hybride'
            : null)

  out.gearbox =
    get('boîte de vitesses', 'boite de vitesses', 'boîte', 'boite') ||
    (/Automatique/i.test(specs.body)
      ? 'Automatique'
      : /Manuelle/i.test(specs.body)
        ? 'Manuelle'
        : null)

  const desc = await page
    .locator('#description, [data-qa-id="description"]')
    .first()
    .textContent()
    .catch(() => null)
  out.description = desc ? desc.trim().slice(0, 5000) : null

  // Téléphone : clic "Afficher le numéro" puis tel: ou regex
  out.phone = null
  out.phone_e164 = null
  try {
    const btn = page
      .locator('button', { hasText: /Afficher le numéro|Voir le numéro/i })
      .first()
    if (await btn.count()) {
      await btn.click()
      await delay(rand(1500, 3000))
    }
    const tel = await page
      .locator('a[href^="tel:"]')
      .first()
      .getAttribute('href')
      .catch(() => null)
    if (tel) {
      out.phone = tel.replace('tel:', '')
    } else {
      const t = (await page.textContent('body').catch(() => '')) ?? ''
      const m = t.match(/0[1-9](?:[\s.-]?\d{2}){4}/)
      if (m) out.phone = m[0]
    }
    const { toE164 } = await import('../lib/supabase.mjs')
    out.phone_e164 = toE164(out.phone)
  } catch {
    // pas de téléphone récupéré : on garde null
  }

  return out
}