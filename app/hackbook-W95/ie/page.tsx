"use client";

import React, { useState } from "react";

const page = () => {
  const [clicked, setClicked] = useState(false);
  const [link, setLink] = useState("https://en.wikipedia.org/wiki/Main_Page");

  return (
    <main className="h-screen w-screen ">
      <div className="flex h-[5vh] justify-start w-full  bg-[#BBC2C2] text-start">
        <h1 className="my-auto mx-2 underline">File</h1>
        <h1 className="my-auto mx-2 underline">Edit</h1>
        <h1 className="my-auto mx-2 underline">View</h1>
        <h1 className="my-auto mx-2 underline">Go</h1>
        <h1 className="my-auto mx-2 underline">Favorites</h1>
        <h1 className="my-auto mx-2 underline">Help</h1>
      </div>

      <div className="border w-full h-0.5 bg-[#BBC2C2] border-b-white border-t-black"></div>
      <div className="flex h-8 justify-start w-full  bg-[#BBC2C2] text-start">
        <h1 className="my-auto mx-2">Address: </h1>
        <input
          type="text"
          className="bg-white h-7 w-full m-auto mx-10 border-2 shadow shadow-black border-black border-b-white border-r-white"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <div className="border w-full h-1 bg-transparent border-t-white border-b-black"></div>

      <div className="  bg-white grid grid-cols-10 grid-rows-6 grid-flow-col"></div>

      <iframe src={link} className={` h-[94vh] w-full m-auto overscroll-none`} />
    </main>
  );
};

export default page;
