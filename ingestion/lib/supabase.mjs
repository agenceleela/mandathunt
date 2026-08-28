import { createClient } from '@supabase/supabase-js'

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      '.env incomplet : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis'
    )
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

export function toE164(phone) {
  if (!phone) return null
  const digits = String(phone).replace(/[^0-9+]/g, '')
  if (/^0\d{9}$/.test(digits)) return '+33' + digits.slice(1)
  if (/^33\d{9}$/.test(digits)) return '+' + digits
  if (/^\+33\d{9}$/.test(digits)) return digits
  return null
}

export async function getAgencies(sb) {
  const { data, error } = await sb.from('agencies').select('*')
  if (error) throw error
  return data ?? []
}

export async function getAgencyContext(sb, agency) {
  const { data: cols } = await sb
    .from('columns')
    .select('id, name, position')
    .eq('agency_id', agency.id)
    .order('position', { ascending: true })
  const list = cols ?? []
  const target = list.find((c) => c.name === 'À contacter') ?? list[0] ?? null
  return { contacterColumnId: target ? target.id : null }
}

export function passesCriteria(parsed, criteria) {
  if (!criteria) return true
  if (
    criteria.price_min != null &&
    (parsed.price == null || parsed.price < criteria.price_min)
  )
    return false
  if (
    criteria.price_max != null &&
    (parsed.price == null || parsed.price > criteria.price_max)
  )
    return false
  if (
    criteria.year_min != null &&
    (parsed.year == null || parsed.year < criteria.year_min)
  )
    return false
  if (
    criteria.mileage_max != null &&
    (parsed.mileage == null || parsed.mileage > criteria.mileage_max)
  )
    return false
  if (criteria.has_phone && !parsed.phone_e164) return false
  return true
}

export async function upsertListing(sb, agency, contacterColumnId, parsed) {
  const { data: existing } = await sb
    .from('listings')
    .select('id, price')
    .eq('agency_id', agency.id)
    .eq('source', parsed.source)
    .eq('source_id', parsed.source_id)
    .maybeSingle()

  const now = new Date().toISOString()

  if (existing) {
    const updates = { last_checked_at: now, is_active: true }
    if (parsed.price != null && existing.price !== parsed.price) {
      updates.price = parsed.price
      updates.last_updated_at = now
      await sb
        .from('price_history')
        .insert({ listing_id: existing.id, price: parsed.price, at: now })
    }
    if (parsed.phone_e164) {
      updates.phone = parsed.phone
      updates.phone_e164 = parsed.phone_e164
    }
    const { error } = await sb
      .from('listings')
      .update(updates)
      .eq('id', existing.id)
    if (error) throw error
    return { status: 'updated', id: existing.id }
  }

  const { data: created, error } = await sb
    .from('listings')
    .insert({
      agency_id: agency.id,
      source: parsed.source,
      source_id: parsed.source_id,
      url: parsed.url,
      title: parsed.title,
      photo_url: parsed.photo_url,
      city: parsed.city,
      postal_code: parsed.postal_code,
      distance_km: null,
      price: parsed.price,
      brand: parsed.brand,
      model: parsed.model,
      year: parsed.year,
      mileage: parsed.mileage,
      fuel: parsed.fuel,
      gearbox: parsed.gearbox,
      power: parsed.power,
      condition: parsed.condition,
      description: parsed.description,
      phone: parsed.phone,
      phone_e164: parsed.phone_e164,
      column_id: contacterColumnId,
      published_at: parsed.published_at ?? now,
      first_seen_at: now,
      last_checked_at: now,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) throw error
  if (parsed.price != null) {
    await sb
      .from('price_history')
      .insert({ listing_id: created.id, price: parsed.price, at: now })
  }
  return { status: 'created', id: created.id }
}