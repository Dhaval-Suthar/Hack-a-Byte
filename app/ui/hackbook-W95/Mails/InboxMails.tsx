"use client";

import { execute } from "@/app/lib/actions";
import { DefaultValues, Errors, Models } from "@/app/lib/constants";
import { ProcessState } from "@/app/lib/definitions";
import clsx from "clsx";
import { useEffect, useState } from "react";

export default function InboxMails({ openLink }: { openLink: any }) {
  const [selectedMail, setSelectedMail] = useState(null);
  const [mails, setMails] = useState([] as any);

  async function fetchMails() {
    const prompt = `${localStorage.getItem("user-" + Models.W95)}@${Models.W95} ${DefaultValues.ROOT_DIRECTORY} % `;

    const formData = new FormData();
    formData.append("command", prompt + "inbox");

    const response = await execute(new ProcessState({}).toPlainObject() as ProcessState, formData);

    if (response.error) {
      return;
    }

    setMails(
      response.message.split("\n").map((mail: string) => {
        const mailData = mail.split(" ");
        const sender = mailData[3];
        const link = mailData[6];
        return { sender, link };
      })
    );
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
        <h1 className="my-auto w-1/2  text-lg">-</h1>
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
      </div>
    </div>
  ));
}
