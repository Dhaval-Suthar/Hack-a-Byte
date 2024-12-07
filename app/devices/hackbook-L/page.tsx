import Console from "../../ui/hackbook-L/console";
import { Models, Errors } from "@/app/lib/constants";
import { haveModel } from "@/app/lib/actions";
import Bot from "@/app/ui/hackbook-L/bot";
import Terminal from "@/app/ui/hackbook-L/terminal";

export default async function Page() {
  const response = await haveModel(Models.L);

  switch (response) {
    case Errors.INVALID_LOGIN:
      return <h1>Invalid Login</h1>; // TODO: Need Improvement
    case Errors.DEVICE_NOT_FOUND:
      return <h1>Model not found</h1>; // TODO: Need Improvement
  }

  return (
    <>
      {/* <Suspense fallback={<LeaderboardSkeleton />}>
        <Leaderboard />
      </Suspense> */}
      <Terminal />
      {/* <Bot /> */}
    </>
  );
}
