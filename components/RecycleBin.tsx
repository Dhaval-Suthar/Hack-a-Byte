"use client";

import React, { useState } from "react";

const RecycleBin = ({ fullscreen }: { fullscreen: boolean }) => {
  return (
    <main className="h-full w-full fixed">
      <div className="flex h-[5vh] justify-start w-full  bg-[#BBC2C2] text-start">
        <h1 className="my-auto mx-2 underline">File</h1>
        <h1 className="my-auto mx-2 underline">Edit</h1>
        <h1 className="my-auto mx-2 underline">View</h1>
        <h1 className="my-auto mx-2 underline">Help</h1>
      </div>

      <div className="border w-full h-1 bg-transparent border-t-white border-b-black"></div>

      <div className={` ${fullscreen ? "h-[87vh]" : "h-[67vh]"}  bg-white flex justify-center`}>
        <h1 className="m-auto text-center">no item</h1>
      </div>
    </main>
  );
};

export default RecycleBin;
