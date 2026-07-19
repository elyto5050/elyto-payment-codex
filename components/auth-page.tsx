"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { TurnstileWidget } from "@/components/turnstile";

interface AuthPageProps {
  title: string;
  description: string;
  initialProviders?: Record<string, boolean> | null;
}

async function verifyTurnstile(token: string) {
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true;
  const res = await fetch("/api/auth/verify-turnstile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
  return res.ok;
}

function getAuthErrorMessage(error?: string | null) {
  switch (error) {
    case "Configuration":
      return "There is a server configuration issue. Please refresh and try again.";
    case "AccessDenied":
      return "Access denied. Please choose a different account or contact support.";
    case "Verification":
      return "Invalid or expired login link. Request a new magic link.";
    case "OAuthAccountNotLinked":
      return "This account is not linked to your Elyto user. Please sign in with a different account.";
    default:
      return error ? "Unable to sign in. Please try again." : null;
  }
}

export default function AuthPage({ title, description, initialProviders = null }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [googleStatus, setGoogleStatus] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string>("");
  const [providers, setProviders] = useState<Record<string, boolean> | null>(initialProviders ?? null);
  const turnstileToken = useRef<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const authError = getAuthErrorMessage(searchParams.get("error"));
    if (authError) {
      setEmailStatus("error");
      setMessage(authError);
    }

    const requestedCallback = searchParams.get("callbackUrl");
    const safeCallbackUrl = requestedCallback && requestedCallback.startsWith("/")
      ? requestedCallback
      : "/dashboard";
    setCallbackUrl(safeCallbackUrl);

    // If server provided initial providers, skip client fetch
    if (initialProviders !== null) return;

    const loadProviders = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch("/api/auth/providers", { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          console.log("[AuthPage] /api/auth/providers responded with non-OK", response.status);
          setProviders({});
          return;
        }
        const data = await response.json();
        console.log("[AuthPage] Providers fetched:", data);
        setProviders(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log("[AuthPage] Failed to fetch providers:", message);
        setProviders({});
      }
    };

    loadProviders();
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleStatus("sending");
    setMessage(null);

    if (!providers?.google) {
      setGoogleStatus("error");
      setMessage("Google login is not configured. Contact your administrator.");
      return;
    }

    try {
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        if (!turnstileToken.current || !(await verifyTurnstile(turnstileToken.current))) {
          throw new Error("Complete the security check first.");
        }
      }

      const result = (await signIn(
        "google",
        { callbackUrl: callbackUrl || "/dashboard" },
        { redirect: false }
      )) as { url?: string; error?: string } | undefined;

      // If provider returned a redirect URL, follow it
      if (result?.url) {
        window.location.href = result.url;
        return;
      }

      // Some signIn flows initiate a full navigation and return undefined — treat that as success
      if (result === undefined) {
        return;
      }

      // Otherwise surface explicit errors only
      if (result?.error) {
        throw new Error(result.error);
      }

      throw new Error("Unable to sign in with Google.");
    } catch (error) {
      setGoogleStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to sign in with Google.");
    }
  };

  const handleMagicLinkSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailStatus("sending");
    setMessage(null);

    if (!providers?.resend) {
      setEmailStatus("error");
      setMessage("Email login is not configured. Contact your administrator.");
      return;
    }

    try {
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        if (!turnstileToken.current || !(await verifyTurnstile(turnstileToken.current))) {
          throw new Error("Complete the security check first.");
        }
      }

      const result = (await signIn(
        "resend",
        { email, callbackUrl: callbackUrl || "/dashboard" },
        { redirect: false }
      )) as { url?: string; error?: string } | undefined;

      if (result?.error) {
        throw new Error(result.error);
      }

      setEmailStatus("success");
      setMessage("Magic link sent! Check your inbox to continue.");
    } catch (error) {
      setEmailStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send magic link.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex justify-center">
          <Logo size={36} />
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>

        {!providers ? (
          <p className="mt-3 rounded-md bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
            Loading authentication options...
          </p>
        ) : (() => {
          const noProviders = providers && providers.google !== true && providers.resend !== true;
          if (noProviders) {
            console.log("[AuthPage] Providers object at render (no providers):", providers);
            return (
              <p className="mt-3 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                No login providers are configured. Please contact support.
              </p>
            );
          }
          return null;
        })()}

        <TurnstileWidget onVerify={(token) => { turnstileToken.current = token; }} />

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="mt-6 w-full rounded-md bg-white px-4 py-3 text-sm font-medium text-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!providers?.google || googleStatus === "sending"}
        >
          {googleStatus === "sending" ? "Connecting to Google..." : "Continue with Google"}
        </button>

        <div className="my-5 h-px bg-border" />

        <form className="space-y-3" onSubmit={handleMagicLinkSubmit}>
          <label className="block text-sm font-medium text-zinc-200" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
            placeholder="you@company.com"
          />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={emailStatus === "sending" || !providers?.resend}
          >
            <Mail size={16} />
            {emailStatus === "sending" ? "Sending magic link..." : "Email magic link"}
          </button>
        </form>

        {message ? (
          <p className={`mt-4 rounded-md px-3 py-2 text-sm ${emailStatus === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
