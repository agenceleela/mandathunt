export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      <main className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl dark:bg-zinc-900">
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-4">
          MandatHut
        </h1>
        <div className="text-center">
          <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-2">
            Setup OK ✓
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Application prête pour le déploiement Vercel
          </p>
        </div>
      </main>
    </div>
  );
}
