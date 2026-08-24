'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email et mot de passe requis' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Vérifier que le profil existe
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, agency_id')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    return { error: 'Aucun profil trouvé pour cet utilisateur. Contactez votre administrateur.' }
  }

  // Pour superadmin, définir l'agence active par défaut (première agence)
  if (profile.role === 'superadmin') {
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)

    if (agencies && agencies.length > 0) {
      const cookieStore = await cookies()
      cookieStore.set('mh_agency_id', agencies[0].id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 jours
      })
    }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function setActiveAgency(agencyId: string) {
  const cookieStore = await cookies()
  cookieStore.set('mh_agency_id', agencyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  })
}
