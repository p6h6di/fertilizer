import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    const { type, data } = evt;

    if (type === "user.created" || type === "user.updated") {
      const {
        id: clerkId,
        email_addresses,
        first_name,
        last_name,
      } = data as {
        id: string;
        email_addresses: { email_address: string }[];
        first_name?: string | null;
        last_name?: string | null;
      };

      const email = email_addresses?.[0]?.email_address ?? "";
      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      await prisma.user.upsert({
        where: { clerkId },
        create: { clerkId, email, name },
        update: { email, name },
      });
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return Response.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
