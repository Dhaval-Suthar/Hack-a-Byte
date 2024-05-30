import { getModels } from "@/app/lib/actions";
import { redirect } from "next/navigation";
import { setUp } from "@/app/lib/actions";
import { MODELS } from "@/app/lib/constants";

export default async function Page() {
  const models = await getModels();

  if (models[MODELS.L] && models[MODELS.L].password !== "-") {
    redirect("/devices/hackbook-L");
  }

  return (
    <>
      <div className="w-screen h-screen flex justify-center text-white text-base">
        <div className="bg-zinc-700 h-40 w-80 m-auto p-5 shadow-md shadow-slate-500">
          <h2 className="text-sm mb-2">set password</h2>

          <form action={setUp}>
            <div className="flex ml-3">
              <label htmlFor="password">Password:</label>
              <input
                className="bg-transparent outline-none"
                maxLength={4}
                inputMode="numeric"
                required
                type="password"
                id="password"
                name="password"
              />
            </div>
            <input type="submit" value="SetUp" className="ml-3 text-sm hover:underline cursor-pointer" />
          </form>

          <h2 className="text-sm my-2">or</h2>

          <form action={setUp}>
            <div className=" ml-3 hidden">
              <label htmlFor="password">Password:</label>
              <input
                className="bg-transparent outline-none"
                type="password"
                id="password"
                name="password"
                value="none"
              />
            </div>
            <input type="submit" value="use without password" className="text-sm hover:underline cursor-pointer" />
          </form>
        </div>
      </div>
    </>
  );
}
