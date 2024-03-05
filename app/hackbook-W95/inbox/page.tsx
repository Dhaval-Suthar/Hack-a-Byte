"use client";

import React from "react";

const page = () => {
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
          <div className="flex">
            <img className="h-16" src="/opened-file.png" alt="" />
            <h1 className="my-auto font-bold text-lg">Inbox</h1>
          </div>
          <div className="flex">
            <img className="h-16" src="/file.png" alt="" />
            <h1 className="my-auto font-extralight text-lg">Outbox</h1>
          </div>
        </div>
        <div className="border w-2 h-[95vh] -mt-1 -py-10 border-t-[#BBC2C2] bg-[#BBC2C2] border-l-white border-r-black  "></div>
        <div className="w-1/2 h-full bg-white border border-r-black border-r-2">
          <div className="flex h-16">
          </div>
          <div className="flex bg-blue-900 text-white justify-around">
            <img className="h-6" src="/mail.png" alt="" />
            <h1 className="my-auto font-extralight text-lg">Hack a Byte</h1>
            <h1 className="my-auto font-extralight text-lg">Reward</h1>
          </div>
        </div>
      </div>
    </main>
  );
};

export default page;
