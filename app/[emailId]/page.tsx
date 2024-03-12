"use client";

import react, { useEffect } from "react";
import { browser } from "../lib/actions";
import { DEFAULT_USER_ID } from "../lib/constants";

const Page = ({ params }: { params: { emailId: string } }) => {
  const emailId = params.emailId;
  const [message, setMessage] = react.useState("");
  const [encrypted, setEncrypted] = react.useState(false);

  async function handleBrowser() {
    const userId = localStorage.getItem("userId") || DEFAULT_USER_ID;
    const response = await browser(userId, "hack", "https://hack-a-byte.vercel.app/" + emailId);

    if (response.error) {
      setMessage(response.error);
      return;
    }

    if (response.encrypted) {
      setEncrypted(true);
      setMessage(response.success + ` Transfer ${response.money}  to hacker to decrypt the data`);
      return;
    }

    if (!response.success) {
      setMessage("Sorry Some Error Occured");
      return;
    }

    setMessage(response.success);
  }

  useEffect(() => {
    handleBrowser();
  }, []);

  return (
    <div className="flex justify-center h-screen w-screen text-center text-white flex-col">
      <h1 className=" mt-auto ">{message}</h1>
      <h3 className={`${encrypted ? "" : "hidden"}`}>If failed to do so, you won't be able to login for 2 days</h3>
      <h3 className={`${encrypted ? "mb-auto" : "hidden"} text-yellow-300`}>Warning: Do not log out.</h3>
    </div>
  );
};

export default Page;
