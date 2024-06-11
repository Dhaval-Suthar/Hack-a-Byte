"use client";

import clsx from "clsx";
import React, { useState } from "react";
import InboxMails from "../Mails/InboxMails";
import OutboxMails from "../Mails/OutboxMails";

export default function Inbox({ openLink }: { openLink: any }) {
  const [selected, setSelected] = useState("Inbox");

  return (
    <div className={` h-full w-full flex overflow-hidden`}>
      <div className="w-1/2 h-full bg-white border border-l-black border-l-2">
        {["Inbox", "Outbox"].map((type) => (
          <div
            key={type}
            className={clsx("flex", {
              "bg-blue-900 text-white": selected === type,
            })}
            onClick={() => {
              setSelected(type);
            }}
          >
            <img
              className="h-16"
              src={selected === type ? "/hackbook-W95/opened-file.png" : "/hackbook-W95/file.png"}
              alt=""
            />
            <h1
              className={clsx("my-auto text-lg", {
                "font-extrabold": selected === type,
                "font-extralight": selected !== type,
              })}
            >
              {type}
            </h1>
          </div>
        ))}
      </div>

      <div
        className={`border w-2 h-[101%] -mt-1 -py-10 border-t-[#BBC2C2] bg-[#BBC2C2] border-l-white border-r-black`}
      ></div>

      <div className="w-1/2 h-full bg-white border  border-r-black border-r-2 font-extralight">
        <div className="flex">
          <div className="flex h-8 w-8 p-0.5 bg-[#BBC2C2] border-2 border-black  border-l-white border-t-white ">
            <img className="h-6 " src="/hackbook-W95/mail-white.png" alt="" />
          </div>
          <div className="flex h-8 w-1/2 bg-[#BBC2C2] border-2 border-black  border-l-white border-t-white ">
            {selected === "Inbox" ? "From" : "To"}
          </div>
          <div className="flex h-8 w-1/2 bg-[#BBC2C2] border-2 border-black  border-l-white border-t-white ">
            Subject
          </div>
        </div>

        {selected === "Inbox" ? <InboxMails openLink={openLink} /> : <OutboxMails openLink={openLink} />}
      </div>
    </div>
  );
}
