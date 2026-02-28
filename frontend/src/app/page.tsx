import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-4">Mindflare AI</h1>
      <p className="mb-8 text-xl text-gray-300">Production-ready AI SaaS platform</p>

      {!session ? (
        <div className="space-x-4">
          <a href="/auth/login?screen_hint=signup" className="px-6 py-2 bg-blue-600 rounded shadow hover:bg-blue-500">Sign up</a>
          <a href="/auth/login" className="px-6 py-2 bg-gray-700 rounded shadow hover:bg-gray-600">Log in</a>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-2xl">Welcome, {session.user.name}!</p>
          <div className="space-x-4">
            <a href="/dashboard" className="px-6 py-2 bg-blue-600 rounded shadow hover:bg-blue-500">Go to Dashboard</a>
            <a href="/auth/logout" className="px-6 py-2 bg-red-600 rounded shadow hover:bg-red-500">Log out</a>
          </div>
        </div>
      )}
    </div>
  );
}
