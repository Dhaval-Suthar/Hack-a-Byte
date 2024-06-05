import Console from "../../ui/hackbook-L/console";
import { DEFAULT_USERNAME, MODELS } from "@/app/lib/constants";
import { getModels } from "@/app/lib/actions";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Leaderboard, { LeaderboardSkeleton } from "@/app/ui/hackbook-L/leaderboard";
import Bot from "@/app/ui/hackbook-L/bot";

export default async function Page() {
  const models = await getModels();
  const cookieStore = cookies();
  const username = cookieStore.get("username")?.value;

  if (!models[MODELS.L]) {
    redirect("/dashboard");
  }

  if (models[MODELS.L].password === "-") {
    redirect("/devices/hackbook-L/setup");
  }

  return (
    <>
      <Suspense fallback={<LeaderboardSkeleton />}>
        <Leaderboard />
      </Suspense>
      <Console user={username || DEFAULT_USERNAME} device={MODELS.L} />
      <Bot />
    </>
  );
}
