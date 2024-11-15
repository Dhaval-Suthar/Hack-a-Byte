import Link from "next/link";
import { buyModel, getModels } from "@/app/lib/actions";
import { Models } from "../lib/constants";
import { HackbookL } from "../ui/hackbook-L/screen";
import { HackbookW95 } from "../ui/hackbook-W95/screen";

export default async function Page() {
  const models = await getModels();

  return (
    <div className="container px-5 py-24 mx-auto">
      <div className="flex flex-wrap -mx-4 -mb-10 text-center">
        <HackbookL models={models} />
        <HackbookW95 models={models} />
      </div>
    </div>
  );
}
