import type { NextRequest } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { Software } from "@/app/lib/definitions";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response("Unauthorized", {
  //     status: 401,
  //   });
  // }

  const client = await clientPromise;
  const db = client.db(process.env.DATABASE_NAME);
  const users = db.collection("users");
  const emails = db.collection("emails");

  const usersList = await users.find({}).toArray();

  let websiteLink = process.env.SITE_URL || "http://localhost:3000/";

  const session = client.startSession();

  try {
    for (const user of usersList) {
      const email = await emails.findOne({
        sender: "hack-a-byte",
        receiver: user.username,
      });

      if (email) {
        continue;
      }

      const website = await db.collection("websites").insertOne(
        {
          owner: "hack-a-byte",
          software: new Software({
            name: "Daily prize",
            desc: "Get 5000 rupees daily",
            type: "reward",
            cost: 5000,
            category: "software",
          }),
          expiresAfter: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        { session }
      );

      await emails.insertOne(
        {
          sender: "hack-a-byte",
          receiver: user.username,
          username: "hack-a-byte",
          link: websiteLink + website.insertedId,
        },
        { session }
      );
    }
  } catch (e) {
    console.error(e);
    return new Response("Error sending emails", {
      status: 500,
    });
  }

  console.log("Emails sent successfully");

  return Response.json({ success: true });
}
