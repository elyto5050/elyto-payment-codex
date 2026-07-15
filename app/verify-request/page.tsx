import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-3xl font-semibold">Check your inbox</h1>
        <p className="mt-4 text-sm text-zinc-400">
          We sent a magic link to your email. Open it to continue signing in to Elyto.
        </p>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted px-6 py-6">
          <p className="text-sm text-zinc-300">If you don’t see the email, check your spam folder or try again.</p>
        </div>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-violet-600"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
