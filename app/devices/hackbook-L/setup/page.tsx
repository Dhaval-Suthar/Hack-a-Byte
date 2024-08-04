import { getModels, getUsername } from "@/app/lib/actions";
import { redirect } from "next/navigation";
import { setUp } from "@/app/lib/actions";
import { MODELS } from "@/app/lib/constants";

export default async function Page() {
  const models = await getModels();
  const username = await getUsername();

  if (models[MODELS.L] && models[MODELS.L].password !== "-") {
    redirect("/devices/hackbook-L");
  }

  return (
    <>
      <div className="w-screen h-screen flex justify-center text-white text-base">
        <div className="bg-zinc-700 h-40 w-80 m-auto p-5 px-3 rounded-lg shadow-md shadow-slate-500">
          <form action={setUp}>
            <div className="flex ml-3 text-sm">
              <label htmlFor="username">username: </label>
              <input
                className="bg-transparent outline-none ml-1"
                required
                id="username"
                name="username"
                defaultValue={username}
              />
            </div>
            <label htmlFor="password-less" className="text-sm ml-3">
              password-less:{" "}
            </label>
            <input type="checkbox" id="password-less" name="password-less" className="peer" />

            <div className="flex ml-3 text-sm peer-checked:text-transparent peer-checked:pointer-events-none">
              <label htmlFor="password">password: </label>
              <input
                className="bg-transparent outline-none ml-1"
                maxLength={4}
                inputMode="numeric"
                type="password"
                id="password"
                name="password"
              />
            </div>
            <input type="submit" value="SetUp" className="ml-3 text-sm hover:underline cursor-pointer" />
          </form>
        </div>
      </div>
    </>
  );
}
