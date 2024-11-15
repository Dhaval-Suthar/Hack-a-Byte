"use server";

import { execute } from "../../lib/actions";
import { cookies } from "next/headers";
import { DefaultValues } from "@/app/lib/constants";
import { ProcessState } from "@/app/lib/definitions";

const Page = async ({ params }: { params: { emailId: string } }) => {
  const emailId = params.emailId;
  const device = cookies().get("active-device")?.value || DefaultValues.COMPUTER_MODEL;
  let message = "Loading...";

  const prompt = `${DefaultValues.USERNAME}@${device} ${DefaultValues.ROOT_DIRECTORY} % `;

  const formData = new FormData();
  formData.append("command", prompt + "visit " + process.env.SITE_URL + emailId);

  const response = await execute(new ProcessState({}).toPlainObject() as ProcessState, formData);

  if (response.message) {
    message = response.message;
  } else {
    message = response.error;
  }

  return (
    <div className="flex justify-center h-screen w-screen text-center text-white flex-col">
      <h1 className="m-auto">{message}</h1>
    </div>
  );
};

export default Page;
