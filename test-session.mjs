import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

try {
  // Use the user ID from earlier evidence
  const userId = "cmq7n40ai0000sl7g47a68i7e";

  // Verify user exists
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true }
  });

  if (!user) {
    console.log("User not found. Checking for any user...");
    const anyUser = await client.user.findFirst({
      select: { id: true, email: true, name: true }
    });
    
    if (anyUser) {
      console.log("Using existing user:", anyUser);
    } else {
      console.log("No users found in database");
      process.exit(1);
    }
  } else {
    console.log("Using user:", user);
  }

  const targetUserId = user?.id || anyUser?.id;

  // Create a session that expires in 24 hours
  const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session = await client.session.create({
    data: {
      sessionToken,
      userId: targetUserId,
      expires: expiresAt,
      ipAddress: "127.0.0.1",
      userAgent: "Test-Script"
    }
  });

  console.log("\n✓ Created session:", session.id);
  console.log("\nSession token:");
  console.log(sessionToken);
  console.log("\nTest with curl:");
  console.log(`curl -H "Cookie: next-auth.session-token=${sessionToken}" http://localhost:3000/api/dashboard/api-keys`);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
} finally {
  await client.$disconnect();
}
