"use client"

import react, { useEffect } from "react";
import { browser } from "../lib/actions";
import { DEFAULT_USER_ID } from "../lib/constants";

const Page = ({ params }: { params: { emailId: string } }) => {
  const emailId = params.emailId;
  const [message, setMessage] = react.useState("");

  async function handleBrowser() {
    const userId = localStorage.getItem("userId") || DEFAULT_USER_ID;
    const response = await browser(userId, "hack", "https://hack-a-byte.vercel.app/" + emailId);

    if (response.error) {
      setMessage(response.error);
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
    <div className="flex justify-center h-screen w-screen">
      <h1 className="text-white m-auto text-center">{message}</h1>
    </div>
  );
};

export default Page;
