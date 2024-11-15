"use client";

import { buyModel } from "@/app/lib/actions";
import { Models, Success } from "@/app/lib/constants";
import Link from "next/link";

export function HackbookW95({ models }: { models: any }) {
  return (
    <div className="sm:w-1/2 mb-10 px-4">
      <div className="rounded-lg h-64 overflow-hidden">
        <img alt="content" className="object-cover object-top h-full w-full" src="/hackbook-W95.png" />
      </div>
      <h2 className="title-font text-2xl font-medium text-gray-900 mt-6 mb-3">Hackbook-W95</h2>
      <p className="leading-relaxed text-base">
        Williamsburg occupy sustainable snackwave gochujang. Pinterest cornhole brunch, slow-carb neutra irony.
      </p>
      {models[Models.W95] ? (
        models[Models.W95].password === "-" ? (
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
        <button
          onClick={async () => {
        const response = await buyModel(Models.W95);
        if (response === Success.DEVICE_BOUGHT) {
          window.location.reload();
        } else {
          alert(response);
        }
          }}
          className="flex mx-auto mt-6 text-white bg-blue-500 border-0 py-2 px-5 focus:outline-none hover:bg-blue-600 rounded"
        >
          Buy
        </button>
      )}
    </div>
  );
}
