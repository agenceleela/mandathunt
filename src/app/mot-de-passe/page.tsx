import { Metadata } from 'next'
import SetPasswordForm from '@/components/SetPasswordForm'

export const metadata: Metadata = {
  title: 'Mot de passe — MandatHunt',
}

export default function MotDePassePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          MandatHunt
        </h1>
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <SetPasswordForm />
        </div>
      </div>
    </div>
  )
}
