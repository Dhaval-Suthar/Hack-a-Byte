"use client";

import { action } from "@/app/lib/actions";
import { DEFAULT_USER_ID } from "@/app/lib/constants";
import React, { useEffect, useState } from "react";

class Mail {
  from: string;
  subject: string;
  type: string;
  link: string;
  clicked: boolean = false;

  constructor(from: string, subject: string, type: string, link: string) {
    this.from = from;
    this.subject = subject;
    this.link = link;
    this.type = type;
  }
}

const Inbox = ({
  fullscreen,
  setLink,
  handleOpenLink,
}: {
  fullscreen: boolean;
  setLink: Function;
  handleOpenLink: Function;
}) => {
  const [selectedType, setSelectedType] = useState("inbox");
  const [mails, setMails] = useState<Mail[]>([]);
  const [clicked, setClicked] = useState("none");

  function deSelectAll() {
    mails.forEach((mail) => {
      mail.clicked = false;
    });
    setMails([...mails]);
    setClicked("none");
  }

  async function fetchMails() {
    const inboxResponse = await action("inbox", {});
    const outboxResponse = await action("outbox", {});

    if (inboxResponse.data) {
      const emailList = JSON.parse(inboxResponse.data);
      emailList.forEach((email: any) => {
        mails.push(new Mail(email.username, "Reward", "inbox", email.link));
      });
      setMails([...mails]);
    }

    if (outboxResponse.data) {
      const emailList = JSON.parse(outboxResponse.data);
      emailList.forEach((email: any) => {
        mails.push(new Mail(email.receiver, "Reward", "outbox", email.link));
      });
      setMails([...mails]);
    }
  }

  useEffect(() => {
    fetchMails();
  }, []);

  return (
    <main className={"h-full w-full fixed"}>
      <div className="flex h-[5vh] justify-start w-full  bg-[#BBC2C2] text-start">
        <h1 className="my-auto mx-2 underline">File</h1>
        <h1 className="my-auto mx-2 underline">Edit</h1>
        <h1 className="my-auto mx-2 underline">View</h1>
        <h1 className="my-auto mx-2 underline">Tools</h1>
        <h1 className="my-auto mx-2 underline">Compose</h1>
        <h1 className="my-auto mx-2 underline">Help</h1>
      </div>

      <div className="border w-full h-1 bg-transparent border-t-white border-b-black"></div>

      <div className={` ${fullscreen ? "h-[85vh]" : "h-[65vh]"} w-full flex`}>
        <div className="w-1/2 h-full bg-white border border-l-black border-l-2">
          <div
            className={`flex  ${clicked === "inbox" ? "bg-blue-900 text-white" : ""}`}
            onClick={() => {
              deSelectAll();
              setSelectedType("inbox");
              setClicked("inbox");
            }}
          >
            <img className="h-16" src="/hackbook-W95/opened-file.png" alt="" />
            <h1 className={`my-auto  ${selectedType === "inbox" ? "font-extrabold" : "font-extralight"} text-lg `}>
              Inbox
            </h1>
          </div>
          <div
            className={`flex  ${clicked === "outbox" ? "bg-blue-900 text-white" : ""}`}
            onClick={() => {
              deSelectAll();
              setSelectedType("outbox");
              setClicked("outbox");
            }}
          >
            <img className="h-16" src="/hackbook-W95/file.png" alt="" />
            <h1 className={`my-auto   ${selectedType === "outbox" ? "font-extrabold" : "font-extralight"} text-lg`}>
              Outbox
            </h1>
          </div>
        </div>
        <div
          className={`border w-2 ${
            fullscreen ? "h-[85vh]" : "h-[65vh]"
          } -mt-1 -py-10 border-t-[#BBC2C2] bg-[#BBC2C2] border-l-white border-r-black`}
        ></div>
        <div className="w-1/2 h-full bg-white border  border-r-black border-r-2 font-extralight">
          <div className="flex">
            <div className="flex h-8 w-8 p-0.5 bg-[#BBC2C2] border-2 border-black  border-l-white border-t-white ">
              <img className="h-6 " src="/hackbook-W95/mail-white.png" alt="" />
            </div>
            <div className="flex h-8 w-1/2 bg-[#BBC2C2] border-2 border-black  border-l-white border-t-white ">
              {selectedType === "inbox" ? "From" : "To"}
            </div>
            <div className="flex h-8 w-1/2 bg-[#BBC2C2] border-2 border-black  border-l-white border-t-white ">
              Subject
            </div>
          </div>

          {mails.map((mail, index) => (
            <div
              key={index}
              className={`${selectedType === mail.type ? "" : "hidden"}`}
              onClick={() => {
                deSelectAll();
                mail.clicked = true;
                setMails([...mails]);
              }}
            >
              <div className={`flex  ${mail.clicked ? "bg-blue-900 text-white " : "text-black "} font-bold `}>
                <img className="h-5 w-8 p-0.5 mt-0.5" src="/hackbook-W95/mail.png" alt="" />
                <h1 className="my-auto w-1/2  text-lg"> {mail.from}</h1>
                <h1 className="my-auto w-1/2  text-lg">Reward</h1>
              </div>
              <div className={`mx-5 my-2 ${mail.clicked ? "" : "hidden "}`}>
                Browse the link!{" "}
                <h1
                  className="text-blue-800 underline cursor-pointer"
                  onClick={() => {
                    setLink(mail.link);
                    handleOpenLink();
                  }}
                >
                  {mail.link}{" "}
                </h1>{" "}
                to get your reward
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Inbox;
