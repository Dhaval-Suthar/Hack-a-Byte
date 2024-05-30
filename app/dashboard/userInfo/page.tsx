import Link from "next/link";
import { getModels } from "@/app/lib/actions";

export default async function Page() {
  const models = await getModels();

  return (
    <>
    <h1>user Info</h1>
    </>
  );
}
