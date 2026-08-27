import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import {
  deleteUserByClerkId,
  syncUserFromClerk,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Prefer Clerk's official env name; accept legacy CLERK_WEBHOOK_SECRET
  const signingSecret =
    process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim() ||
    process.env.CLERK_WEBHOOK_SECRET?.trim();
  if (!signingSecret) {
    // Local/dev without tunnel — do not fail deployment health checks
    return new Response("Webhook secret not configured; skipped", {
      status: 200,
    });
  }

  let evt;
  try {
    evt = await verifyWebhook(req, { signingSecret });
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  try {
    if (evt.type === "user.created" || evt.type === "user.updated") {
      await syncUserFromClerk(evt.data);
    } else if (evt.type === "user.deleted") {
      if (evt.data.id) {
        await deleteUserByClerkId(evt.data.id);
      }
    }
  } catch (err) {
    console.error("Clerk webhook handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
