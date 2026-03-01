import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-4xl font-bold">Benmo</h1>
      <p className="text-lg text-gray-600">Private payments on Monad</p>
      <div className="flex gap-4">
        <Link
          href="/onboarding"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
        >
          Get Started
        </Link>
        <Link
          href="/dashboard"
          className="border border-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
