import { jwtVerify, SignJWT } from "jose";

// Get the secret from environment
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!secret) {
  console.error("Error: AUTH_SECRET or NEXTAUTH_SECRET not set");
  process.exit(1);
}

// Create a JWT token manually
const key = new TextEncoder().encode(secret);

const token = await new SignJWT({
  sub: "cmq7n40ai0000sl7g47a68i7e",
  email: "avairalpandey@gmail.com",
  id: "cmq7n40ai0000sl7g47a68i7e",
  organizationId: undefined,
  platformRole: "USER",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
})
  .setProtectedHeader({ alg: "HS256" })
  .sign(key);

console.log("Valid JWT token:");
console.log(token);
console.log("\nTest with curl:");
console.log(`curl -H "Cookie: next-auth.session-token=${token}" http://localhost:3000/api/dashboard/api-keys`);

// Try to verify it works
try {
  const verified = await jwtVerify(token, key);
  console.log("\n✓ Token verification successful");
  console.log("Payload:", verified.payload);
} catch (err) {
  console.error("Token verification failed:", err.message);
}
