import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const email = user.emailAddresses[0]?.emailAddress ?? "";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, email, name },
      update: { email, name },
    });

    return Response.json({ user: dbUser });
  } catch (err) {
    console.error("User sync error:", err);
    return Response.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
