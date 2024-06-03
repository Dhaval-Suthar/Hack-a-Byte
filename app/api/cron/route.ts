import { sendDailyEmails } from "@/app/lib/actions";
import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response("Unauthorized", {
  //     status: 401,
  //   });
  // }

  // Run your cron job here
  sendDailyEmails();

  return Response.json({ success: true });
}
