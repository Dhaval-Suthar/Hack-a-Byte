import Link from "next/link";
import { getModels } from "@/app/lib/actions";
import { MODELS } from "../lib/constants";

export default async function Page() {
  const models = await getModels();

  return (
    <div className="container px-5 py-24 mx-auto">
      <div className="flex flex-wrap -mx-4 -mb-10 text-center">
        <div className="sm:w-1/2 mb-10 px-4">
          <div className="rounded-lg h-64 overflow-hidden">
            <img alt="content" className="object-cover object-top h-full w-full" src="/hackbook-L.png" />
          </div>
          <h2 className="title-font text-2xl font-medium text-gray-900 mt-6 mb-3">Hackbook-L</h2>
          <p className="leading-relaxed text-base">
            Williamsburg occupy sustainable snackwave gochujang. Pinterest cornhole brunch, slow-carb neutra irony.
          </p>
          {models[MODELS.L] ? (
            models[MODELS.L].password === "-" ? (
              <Link href="/devices/hackbook-L/setup">
                <button className="flex mx-auto mt-6 text-white bg-blue-500 border-0 py-2 px-5 focus:outline-none hover:bg-blue-600 rounded">
                  SetUp
                </button>{" "}
              </Link>
            ) : (
              <Link href="/devices/hackbook-L">
                <button className="flex mx-auto mt-6 text-white bg-red-500 border-0 py-2 px-5 focus:outline-none hover:bg-green-600 rounded">
                  Power
                </button>
              </Link>
            )
          ) : (
            <button className="flex mx-auto mt-6 text-white bg-yellow-500 border-0 py-2 px-5 focus:outline-none hover:bg-yellow-600 rounded">
              Buy
            </button>
          )}
        </div>
        <div className="sm:w-1/2 mb-10 px-4">
          <div className="rounded-lg h-64 overflow-hidden">
            <img alt="content" className="object-cover object-top h-full w-full" src="/hackbook-W95.png" />
          </div>
          <h2 className="title-font text-2xl font-medium text-gray-900 mt-6 mb-3">Hackbook-W95</h2>
          <p className="leading-relaxed text-base">
            Williamsburg occupy sustainable snackwave gochujang. Pinterest cornhole brunch, slow-carb neutra irony.
          </p>
          {models[MODELS.W95] ? (
            models[MODELS.W95].password === "-" ? (
              <Link href="/devices/hackbook-W95/setup">
                <button className="flex mx-auto mt-6 text-white bg-blue-500 border-0 py-2 px-5 focus:outline-none hover:bg-blue-600 rounded">
                  SetUp
                </button>
              </Link>
            ) : (
              <Link href="/devices/hackbook-W95/login">
                <button className="flex mx-auto mt-6 text-white bg-red-500 border-0 py-2 px-5 focus:outline-none hover:bg-green-600 rounded">
                  Power
                </button>
              </Link>
            )
          ) : (
            <button className="flex mx-auto mt-6 text-white bg-blue-500 border-0 py-2 px-5 focus:outline-none hover:bg-blue-600 rounded">
              Buy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
