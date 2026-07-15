export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">Security</h1>
      <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-400">
        <p>Elyto is built with security as a core requirement, not an afterthought.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>AES-256-GCM encryption for Gmail OAuth tokens at rest</li>
          <li>API keys hashed with pepper — never stored in plaintext</li>
          <li>HMAC-SHA256 webhook signatures with timestamp replay protection</li>
          <li>Tenant isolation on every database query</li>
          <li>Rate limiting on all public and API endpoints</li>
          <li>Cloudflare Turnstile on authentication flows</li>
          <li>Audit logs for sensitive actions</li>
          <li>Security headers: X-Frame-Options, CSP-ready, nosniff</li>
        </ul>
        <p>Report vulnerabilities: security@elyto.in</p>
      </div>
    </main>
  );
}
