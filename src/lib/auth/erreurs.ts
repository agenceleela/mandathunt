export function traduireErreur(message: string | null | undefined): string {
  const m = (message ?? '').toLowerCase()
  if (m.includes('invalid login credentials'))
    return 'Email ou mot de passe incorrect.'
  if (m.includes('email not confirmed'))
    return 'Email non confirmé. Vérifiez votre boîte mail.'
  if (m.includes('session missing') || m.includes('no session'))
    return 'Session manquante. Ouvrez le lien reçu par email.'
  if (m.includes('at least 6') || m.includes('6 characters'))
    return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (
    m.includes('rate limit') ||
    m.includes('too many requests') ||
    m.includes('security purposes')
  )
    return 'Trop de tentatives. Réessayez dans quelques minutes.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Un compte existe déjà avec cet email.'
  if (
    m.includes('expired') ||
    m.includes('invalid otp') ||
    m.includes('invalid token')
  )
    return 'Lien expiré ou invalide. Demandez un nouveau lien.'
  if (m.includes('invalid email')) return 'Email invalide.'
  return 'Une erreur est survenue. Réessayez.'
}
