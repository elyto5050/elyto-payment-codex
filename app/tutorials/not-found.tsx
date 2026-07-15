import Link from "next/link";

export default function TutorialsNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-white">Tutorial Not Found</h1>
      <p className="mt-4 text-sm text-zinc-400">We couldn't find the tutorial you're looking for.</p>
      <div className="mt-6">
        <Link href="/tutorials" className="inline-block rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">Browse Tutorials</Link>
      </div>
    </main>
  );
}
