"use client";

import React, { useState } from "react";

const page = () => {
  const [clicked, setClicked] = useState(false);
  return (
    <main className="h-screen w-screen ">
      <div className="flex h-[5vh] justify-start w-full  bg-[#BBC2C2] text-start">
        <h1 className="my-auto mx-2 underline">File</h1>
        <h1 className="my-auto mx-2 underline">Edit</h1>
        <h1 className="my-auto mx-2 underline">View</h1>
        <h1 className="my-auto mx-2 underline">Help</h1>
      </div>

      <div className="border w-full h-1 bg-transparent border-t-white border-b-black"></div>

      <div className=" h-[94vh] w-full bg-white grid grid-cols-10 grid-rows-6 grid-flow-col">
        <div
          className="col-span-1 row-span-1 flex justify-center z-10"
          onClick={() => {
            if (clicked) {
              setClicked(false);
              alert("You cannot open hard disk now.(wait for further updates)");
              return;
            }
            setClicked(true);
          }}
        >
          <div className="m-auto text-center break-words">
            <img className={`h-24 w-24 ${clicked ? "saturate-200" : ""}  `} src="/hard-disk.png" />
            <h4 className={`w-24 text-sm ${clicked ? "text-white bg-blue-700" : ""} `}>Hard Disk (C:)</h4>
          </div>
        </div>
      </div>
    </main>
  );
};

export default page;
