"use client";

import React from "react";

const InternetExplorer = ({
  fullscreen,
  link,
  setLink,
}: {
  fullscreen: boolean;
  link: string;
  setLink: (link: string) => void;
}) => {
  return (
    <main className={`w-full h-full fixed `}>
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
          onClick={(e) => {
            const input = e.target as HTMLInputElement;
            input.select();
          }}
        />
      </div>
      <div className="border w-full h-1 bg-transparent border-t-white border-b-black"></div>

      <div className="  bg-white grid grid-cols-10 grid-rows-6 grid-flow-col"></div>

      <iframe
        src={link}
        className={` ${fullscreen ? "w-[98vw] h-[80vh]" : "w-[78vw] h-[60vh]"} m-auto overscroll-none`}
      />
    </main>
  );
};

export default InternetExplorer;
