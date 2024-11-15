import { DefaultValues } from "@/app/lib/constants";
import { execute } from "../../lib/actions";
import { ProcessState } from "@/app/lib/definitions";

export default async function Leaderboard() {
  const formdata = new FormData();
  formdata.append(
    "command",
    DefaultValues.USERNAME + "@" + DefaultValues.COMPUTER_MODEL + " " + DefaultValues.ROOT_DIRECTORY + " % leaderboard"
  );
  const response = await execute(new ProcessState({}), formdata); //TODO: Fetch the leaderboard after a interval of 5 seconds

  return (
    <div
      id="leaderboard"
      className="w-60 h-80 z-30 fixed transition-all duration-1000 top-0 right-0 rounded-l-lg shadow-gray-500/40 shadow bg-gray-400 text-zinc-400 bg-opacity-5 opacity-0 sm:opacity-100"
    >
      <h1 className="text-center m-2 text-zinc-100">LEADERBOARD</h1>
      {response.message.split("\n").map((line, index) => (
        <h3 key={index} className="mx-2 flex">
          {line}
        </h3>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div
      id="leaderboard"
      className="w-60 h-80 z-30 fixed transition-all duration-1000 top-0 right-0 rounded-l-lg shadow-gray-500/40 shadow bg-gray-400 text-zinc-400 bg-opacity-5 opacity-0 sm:opacity-100"
    >
      <h1 className="text-center m-2 text-zinc-100">LEADERBOARD</h1>
      <h3 className="mx-2 flex">
        0. <div className="w-40 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
      <h3 className="mx-2 flex">
        1. <div className="w-36 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
      <h3 className="mx-2 flex">
        2. <div className="w-44 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
      <h3 className="mx-2 flex">
        3. <div className="w-12 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
      <h3 className="mx-2 flex">
        4. <div className="w-28 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
      <h3 className="mx-2 flex">
        5. <div className="w-32 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
      <h3 className="mx-2 flex">
        6. <div className="w-40 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
      <h3 className="mx-2 flex">
        7. <div className="w-24 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
      <h3 className="mx-2 flex">
        8. <div className="w-52 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
      <h3 className="mx-2 flex">
        9. <div className="w-36 h-5 mx-2 rounded-md duration-100 animate-pulse bg-gray-500/40" />
      </h3>
    </div>
  );
}
