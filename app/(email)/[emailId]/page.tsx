"use client";

import react, { useEffect } from "react";
import { browser, transfer } from "../../lib/actions";
import { DEFAULT_USER_ID } from "../../lib/constants";
import { useRouter } from "next/navigation";

const Page = ({ params }: { params: { emailId: string } }) => {
  const router = useRouter();

  const emailId = params.emailId;
  const [message, setMessage] = react.useState("");
  const [encrypted, setEncrypted] = react.useState(false);
  const [amount, setAmount] = react.useState(false);
  const [owner, setOwner] = react.useState("");

  async function handleBrowser() {
    const userId = localStorage.getItem("userId") || DEFAULT_USER_ID;
    const response = await browser(userId, "hack", "https://hack-a-byte.vercel.app/" + emailId);

    if (response.error) {
      setMessage(response.error);
      return;
    }

    if (response.encrypted) {
      setEncrypted(true);
      setAmount(response.money);
      setOwner(response.owner);
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
      <h1 className={`${encrypted ? "mt-auto" : "m-auto"}`}>{message}</h1>
      <h3 className={`${encrypted ? "" : "hidden"}`}>If failed to do so, you won't be able to login for 2 days</h3>
      <div className={`${encrypted ? "mb-auto" : "hidden"} flex justify-around`}>
        <h1 className="text-green-700 text-2xl" onClick={ async () => {
          const userId = localStorage.getItem("userId") || DEFAULT_USER_ID;
          await transfer(userId, owner, Number(amount));
          router.push("/hackbook-W95");
        }}>
          Pay
        </h1>
        <h1
          className="text-red-900 text-2xl"
          onClick={() => {
            router.push("/hackbook-W95/app-icon/login");
          }}
        >
          Leave
        </h1>
      </div>
    </div>
  );
};

export default Page;
