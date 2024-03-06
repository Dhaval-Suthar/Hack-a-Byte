"use client";

import React, { useState } from "react";

class Mail {
  from: string;
  subject: string;
  type: string;
  clicked: boolean = false;

  constructor(from: string, subject: string, type: string) {
    this.from = from;
    this.subject = subject;
    this.type = type;
  }
}

const MAILS: Mail[] = [
  new Mail("admin", "Money", "inbox"),
  new Mail("admin", "Money", "outbox"),
  new Mail("admin", "Money", "inbox"),
];

const page = () => {
  const [selectedType, setSelectedType] = useState("inbox");
  const [mails, setMails] = useState(MAILS);
  const [clicked, setClicked] = useState("none");

  function deSelectAll() {
    mails.forEach((mail) => {
      mail.clicked = false;
    });
    setMails([...mails]);
    setClicked("none");
  }

  return (
    <main className="h-screen w-screen ">
      <div className="flex h-[5vh] justify-start w-full  bg-[#BBC2C2] text-start">
        <h1 className="my-auto mx-2 underline">File</h1>
        <h1 className="my-auto mx-2 underline">Edit</h1>
        <h1 className="my-auto mx-2 underline">View</h1>
        <h1 className="my-auto mx-2 underline">Tools</h1>
        <h1 className="my-auto mx-2 underline">Compose</h1>
        <h1 className="my-auto mx-2 underline">Help</h1>
      </div>

      <div className="border w-full h-1 bg-transparent border-t-white border-b-black"></div>

      <div className=" h-[94vh] w-full flex">
        <div className="w-1/2 h-full bg-white border border-l-black border-l-2">
          <div
            className={`flex  ${clicked === "inbox" ? "bg-blue-900 text-white" : ""}`}
            onClick={() => {
              deSelectAll();
              setSelectedType("inbox");
              setClicked("inbox");
            }}
          >
            <img className="h-16" src="/opened-file.png" alt="" />
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
            <img className="h-16" src="/file.png" alt="" />
            <h1 className={`my-auto   ${selectedType === "outbox" ? "font-extrabold" : "font-extralight"} text-lg`}>
              Outbox
            </h1>
          </div>
        </div>
        <div className="border w-2 h-[95vh] -mt-1 -py-10 border-t-[#BBC2C2] bg-[#BBC2C2] border-l-white border-r-black  "></div>
        <div className="w-1/2 h-full bg-white border  border-r-black border-r-2 font-extralight">
          <div className="flex">
            <div className="flex h-8 w-8 p-0.5 bg-[#BBC2C2] border-2 border-black  border-l-white border-t-white ">
              <img className="h-6 " src="/mail-white.png" alt="" />
            </div>
            <div className="flex h-8 w-1/2 bg-[#BBC2C2] border-2 border-black  border-l-white border-t-white ">
              From
            </div>
            <div className="flex h-8 w-1/2 bg-[#BBC2C2] border-2 border-black  border-l-white border-t-white ">
              Subject
            </div>
          </div>

          {mails.map((mail, index) => (
            <div
              key={index}
              className={`${selectedType === mail.type ? "hidden" : ""}`}
              onClick={() => {
                deSelectAll();
                mail.clicked = true;
                setMails([...mails]);
              }}
            >
              <div className={`flex  ${mail.clicked ? "bg-blue-900 text-white " : "text-black "} font-bold `}>
                <img className="h-5 w-8 p-0.5 mt-0.5" src="/mail.png" alt="" />
                <h1 className="my-auto w-1/2  text-lg">Hack a Byte</h1>
                <h1 className="my-auto w-1/2  text-lg">Reward</h1>
              </div>
              <div className={`mx-5 my-2 ${mail.clicked ? "" : "hidden "}`}>
                Browse the link! http://localhost:3000/hackbook-W95 to get your reward
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default page;
