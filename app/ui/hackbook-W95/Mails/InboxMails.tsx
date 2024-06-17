import { action } from "@/app/lib/actions";
import { MODELS } from "@/app/lib/constants";
import clsx from "clsx";
import { useEffect, useState } from "react";

export default function InboxMails({ openLink }: { openLink: any }) {
  const [selectedMail, setSelectedMail] = useState(null);
  const [mails, setMails] = useState([] as any);

  async function fetchMails() {
    const response = await action("inbox", {}, MODELS.W95);
    setMails(JSON.parse(response.data || "[]"));
  }

  useEffect(() => {
    fetchMails();
  }, []);

  return mails.map((mail: any, index: number) => (
    <div
      key={index}
      onClick={() => {
        setSelectedMail(mail);
      }}
    >
      <div
        className={clsx("flex font-bold", {
          "bg-blue-900 text-white": selectedMail === mail,
          "text-black ": selectedMail !== mail,
        })}
      >
        <img className="h-5 w-8 p-0.5 mt-0.5" src="/hackbook-W95/mail.png" alt="" />
        <h1 className="my-auto w-1/2  text-lg"> {mail.sender}</h1>
        <h1 className="my-auto w-1/2  text-lg">Reward</h1>
      </div>
      <div
        className={clsx("mx-5 my-2 ", {
          "hidden ": selectedMail !== mail,
        })}
      >
        Browse the link!
        <h1 className="text-blue-800 underline cursor-pointer" onClick={() => openLink(mail.link)}>
          {mail.link}{" "}
        </h1>
        to get your reward
      </div>
    </div>
  ));
}
