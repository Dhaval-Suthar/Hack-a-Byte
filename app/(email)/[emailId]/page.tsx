"use client";

import react, { useEffect } from "react";
// import { execute } from "../../lib/actions";

const Page = ({ params }: { params: { emailId: string } }) => {
  const emailId = params.emailId;
  const [message, setMessage] = react.useState("");

  async function handleBrowser() {
    // const response = await action("visit", "https://hack-a-byte.vercel.app/" + emailId);

    // if (response.error) {
    //   setMessage(response.error);
    //   return;
    // }

    // if (response.data) {
    //   setMessage(response.data);
    // }
  }

  useEffect(() => {
    handleBrowser();
  }, []);

  return (
    <div className="flex justify-center h-screen w-screen text-center text-white flex-col">
      <h1 className="m-auto">{message}</h1>
    </div>
  );
};

export default Page;
