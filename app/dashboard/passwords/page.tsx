import Link from "next/link";
import { getModels } from "@/app/lib/actions";
import { MODELS } from "@/app/lib/constants";

export default async function Page() {
  const models = await getModels();

  return (
    <>
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto">
          <div className="flex flex-col text-center w-full mb-20">
            <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">Passwords</h1>
            <p className="lg:w-2/3 mx-auto leading-relaxed text-base">In case you forget your device password</p>
          </div>

          <div className="flex flex-wrap justify-around -m-2">
            {models[MODELS.L] && (
              <div className="w-80  border rounded-lg shadow bg-gray-800 border-gray-700">
                <div className="p-5">
                  <h5 className="mb-2 text-2xl font-bold tracking-tight text-white">{MODELS.L}</h5>
                  <p className="mb-3 font-normal text-gray-400">{models[MODELS.L].password}</p>
                  <Link
                    href="/devices/hackbook-L"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-blue-300 "
                  >
                    Connect
                  </Link>
                </div>
              </div>
            )}
            {models[MODELS.W95] && (
              <div className="w-80  border rounded-lg shadow bg-gray-800 border-gray-700">
                <div className="p-5">
                  <h5 className="mb-2 text-2xl font-bold tracking-tight text-white">{MODELS.W95}</h5>
                  <p className="mb-3 font-normal text-gray-400">{models[MODELS.W95].password}</p>
                  <Link
                    href="/devices/hackbook-W95/login"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-blue-300 "
                  >
                    Connect
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
