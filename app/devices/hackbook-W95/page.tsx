import Desktop from "../../ui/hackbook-W95/desktop";
import { DEFAULT_USERNAME, MODELS } from "@/app/lib/constants";
import { getModels } from "@/app/lib/actions";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Page() {
  const models = await getModels();
  const cookieStore = cookies();
  const username = cookieStore.get("username")?.value;

  if (!models[MODELS.W95]) {
    redirect("/dashboard");
  }

  if (models[MODELS.W95].password === "-") {
    redirect("/devices/hackbook-W95/login");
  }

  return (
    <>
      <div className="w-screen h-screen fixed overflow-auto">
        <Desktop user={username || DEFAULT_USERNAME} />
      </div>
    </>
  );
}
