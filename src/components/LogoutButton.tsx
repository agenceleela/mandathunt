import { logout } from '@/lib/auth/actions'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
      >
        Déconnexion
      </button>
    </form>
  )
}