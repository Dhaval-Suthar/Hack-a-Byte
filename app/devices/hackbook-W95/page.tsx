import Desktop from "../../ui/hackbook-W95/desktop";
import { DefaultValues, Errors, Models } from "@/app/lib/constants";
import { haveModel } from "@/app/lib/actions";
import { DefaultValues, Errors, Models } from "@/app/lib/constants";
import { haveModel } from "@/app/lib/actions";

export default async function Page() {
  const response = await haveModel(Models.W95);

  switch (response) {
    case Errors.INVALID_LOGIN:
      return <h1>Invalid Login</h1>; // TODO: Need Improvement
    case Errors.DEVICE_NOT_FOUND:
      return <h1>Model not found</h1>; // TODO: Need Improvement
  const response = await haveModel(Models.W95);

  switch (response) {
    case Errors.INVALID_LOGIN:
      return <h1>Invalid Login</h1>; // TODO: Need Improvement
    case Errors.DEVICE_NOT_FOUND:
      return <h1>Model not found</h1>; // TODO: Need Improvement
  }

  return (
    <>
      <div className="w-screen h-screen fixed overflow-auto">
        <Desktop />
      </div>
    </main>
  );
};

export default Page;
