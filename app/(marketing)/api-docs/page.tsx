const endpoints = [
  { method: "POST", path: "/api/v1/projects", desc: "Create a project (requires secret key)" },
  { method: "POST", path: "/api/v1/orders", desc: "Create order and get checkout URL" },
  { method: "GET", path: "/api/v1/orders/:orderId", desc: "Get order status" },
  { method: "POST", path: "/api/v1/orders/:orderId/verify", desc: "Submit UTR for verification" },
  { method: "GET", path: "/api/v1/transactions", desc: "List parsed transactions" },
  { method: "GET", path: "/api/v1/analytics", desc: "Get analytics summary" }
];

const webhookEvents = ["order.created", "order.utr_submitted", "order.verified", "order.failed"];

export default function ApiDocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-semibold text-white">API Reference</h1>
      <p className="mt-4 text-zinc-400">REST API v1 — authenticate with Bearer secret key.</p>

      <h2 className="mt-12 text-xl font-medium text-white">Authentication</h2>
      <pre className="mt-4 overflow-auto rounded-lg border border-border bg-black p-4 text-sm text-zinc-300">
{`Authorization: Bearer elyto_sk_live_...`}
      </pre>

      <h2 className="mt-12 text-xl font-medium text-white">Endpoints</h2>
      <div className="mt-6 space-y-3">
        {endpoints.map((ep) => (
          <div key={ep.path} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-xs text-primary">{ep.method}</span>
              <code className="text-sm text-zinc-200">{ep.path}</code>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{ep.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-medium text-white">Webhook events</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {webhookEvents.map((e) => (
          <span key={e} className="rounded-md border border-border px-3 py-1 font-mono text-xs text-secondary">{e}</span>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-medium text-white">Webhook verification examples</h2>

      <h3 className="mt-6 text-sm font-medium text-zinc-300">Node.js / Express</h3>
      <pre className="mt-2 overflow-auto rounded-lg border border-border bg-black p-4 text-xs leading-6 text-zinc-300">
{`const crypto = require("crypto");
app.post("/webhooks/elyto", express.raw({ type: "application/json" }), (req, res) => {
  const payload = req.body.toString();
  const ts = req.headers["elyto-timestamp"];
  const sig = req.headers["elyto-signature"];
  const expected = "v1=" + crypto.createHmac("sha256", SECRET).update(ts + "." + payload).digest("hex");
  if (sig !== expected) return res.status(401).end();
  res.json({ received: true });
});`}
      </pre>

      <h3 className="mt-6 text-sm font-medium text-zinc-300">Python (Flask)</h3>
      <pre className="mt-2 overflow-auto rounded-lg border border-border bg-black p-4 text-xs leading-6 text-zinc-300">
{`import hmac, hashlib
@app.route("/webhooks/elyto", methods=["POST"])
def elyto_webhook():
    payload = request.get_data(as_text=True)
    ts = request.headers.get("Elyto-Timestamp")
    sig = request.headers.get("Elyto-Signature")
    expected = "v1=" + hmac.new(SECRET.encode(), f"{ts}.{payload}".encode(), hashlib.sha256).hexdigest()
    if sig != expected: return ("", 401)
    return {"received": True}`}
      </pre>

      <h3 className="mt-6 text-sm font-medium text-zinc-300">PHP</h3>
      <pre className="mt-2 overflow-auto rounded-lg border border-border bg-black p-4 text-xs leading-6 text-zinc-300">
{`$payload = file_get_contents("php://input");
$ts = $_SERVER["HTTP_ELYTO_TIMESTAMP"];
$sig = $_SERVER["HTTP_ELYTO_SIGNATURE"];
$expected = "v1=" . hash_hmac("sha256", "$ts.$payload", $secret);
if (!hash_equals($expected, $sig)) { http_response_code(401); exit; }
echo json_encode(["received" => true]);`}
      </pre>
    </main>
  );
}
