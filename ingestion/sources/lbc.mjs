// Scraper leboncoin — mode humain (fenêtre visible, délais aléatoires).
// Les sélecteurs sont des meilleures estimations + fallbacks ;
// ils seront calibrés au 1er run via les logs et captures debug/.

export const SOURCE = 'lbc'

const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

export const delay = (ms) => new Promise((r) => setTimeout(r, ms))

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
  if (t.includes('hier'))
    return new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const m = t.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00`).toISOString()
  return now
}

async function waitForHuman(page, message) {
  // eslint-disable-next-line no-console
  console.log(`\n⚠️ ${message}\n   Résolvez dans la fenêtre du navigateur, puis appuyez sur Entrée ici.`)
  const readline = await import('readline')
  const rl = readline.createInterface({ input: process.stdin })
  await new Promise((r) => rl.question('', () => { rl.close(); r() }))
}

export async function detectCaptcha(page) {
  const body = (await page.textContent('body').catch(() => '')) ?? ''
  return /vérifions|captcha|robot|sécurité inhabituelle/i.test(body)
}

export async function scrapeListPage(page, agency) {
  const url = buildSearchUrl(agency)
  // eslint-disable-next-line no-console
  console.log(`→ Ouverture ${url}`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await delay(rand(3000, 6000))

  if (await detectCaptcha(page)) {
    await waitForHuman(page, 'CAPTCHA leboncoin détecté.')
    await delay(2000)
  }

  const cards = await page.locator('article, div[data-qa-id="listing"], a[href*="/ad/"]').all()
  const items = []
  for (const card of cards) {
    try {
      const html = await card.innerHTML().catch(() => '')
      const linkMatch = html.match(/href="(https?:\/\/www\.leboncoin\.fr\/(?:ad|voitures)\/[^"]+)"/)
        ?? html.match(/href="(\/(?:ad|voitures)\/[^"]+)"/)
      if (!linkMatch) continue
      let href = linkMatch[1]
      if (href.startsWith('/')) href = `https://www.leboncoin.fr${href}`
      const idMatch = href.match(/\/(\d{6,})/)
      if (!idMatch) continue
      const sourceId = idMatch[1]
      if (items.some((i) => i.source_id === sourceId)) continue

      const text = (await card.textContent().catch(() => '')) ?? ''
      const img = await card.locator('img').first().getAttribute('src').catch(() => null)
      const { city, postal_code } = parseCityZip(text)

      items.push({
        source: 'lbc',
        source_id: sourceId,
        url: href,
        title: text.split('\n')[0]?.slice(0, 140) ?? null,
        photo_url: img,
        city,
        postal_code,
        price: parsePrice(text),
        published_at: parsePublished(text, new Date().toISOString()),
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

  const body = (await page.textContent('body').catch(() => '')) ?? ''

  const out = { ...item }

  // Caractéristiques : paires clé/valeur génériques
  const year = body.match(/(19|20)\d{2}/)
  out.year = year ? parseInt(year[0], 10) : null
  const km = body.match(/([\d\s]{2,})\s*km/)
  out.mileage = km ? parseInt(km[1].replace(/\s/g, ''), 10) : null
  out.fuel = /Essence/i.test(body) ? 'Essence' : /Diesel/i.test(body) ? 'Diesel' : /Électrique|Electrique/i.test(body) ? 'Électrique' : /Hybride/i.test(body) ? 'Hybride' : null
  out.gearbox = /Automatique/i.test(body) ? 'Automatique' : /Manuelle/i.test(body) ? 'Manuelle' : null

  const desc = await page
    .locator('#description, [data-qa-id="description"]')
    .first()
    .textContent()
    .catch(() => null)
  out.description = desc ? desc.trim().slice(0, 5000) : null

  // Téléphone : clic "Afficher le numéro"
  out.phone = null
  out.phone_e164 = null
  try {
    const btn = page.locator('button', { hasText: /Afficher le numéro/i }).first()
    if (await btn.count()) {
      await btn.click()
      await delay(rand(1500, 3000))
      const tel = await page.locator('a[href^="tel:"]').first().getAttribute('href').catch(() => null)
      if (tel) {
        out.phone = tel.replace('tel:', '')
      } else {
        const t = (await page.textContent('body').catch(() => '')) ?? ''
        const m = t.match(/0[1-9](?:[\s.-]?\d{2}){4}/)
        if (m) out.phone = m[0]
      }
      const { toE164 } = await import('../lib/supabase.mjs')
      out.phone_e164 = toE164(out.phone)
    }
  } catch {
    // pas de téléphone récupéré : on garde null
  }

  return out
}