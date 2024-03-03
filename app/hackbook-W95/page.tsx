"use client";

import React, { useState } from "react";

const APPS = [
  {
    name: "Internet Explorer",
    icon: "/ie.png",
    path: "/ie",
    clicked: false,
  },
  {
    name: "My Computer",
    icon: "/mycomputer.png",
    path: "/mycomputer",
    clicked: false,
  },
  {
    name: "Recycle Bin",
    icon: "/recyclebin.png",
    path: "/recyclebin",
    clicked: false,
  },
  {
    name: "Inbox",
    icon: "/inbox.png",
    path: "/inbox",
    clicked: false,
  },
];

const page = () => {
  const [apps, setApps] = useState(APPS);
  const [clickedStart, setClickedStart] = useState(false);

  function deSelectAll() {
    apps.forEach((app) => {
      app.clicked = false;
    });
    setApps([...apps]);
    setClickedStart(false);
  }

  return (
    <main className="bg-[#008080] h-screen w-screen ">
      <div className="h-[96vh] w-screen absolute z-0" onClick={deSelectAll}></div>
      <div className="grid grid-cols-10 grid-rows-6 grid-flow-col w-screen h-[96vh] text-black">
        {APPS.map((app, index) => (
          <div
            key={app.name}
            className="col-span-1 row-span-1 flex justify-center z-10"
            onClick={() => {
              deSelectAll();
              apps[index].clicked = true;
              setApps([...apps]);
            }}
          >
            <div className="m-auto text-center break-words">
              <img className={`h-24 w-24 ${app.clicked ? "saturate-200" : ""} `} src={app.icon} />
              <h4 className={`w-20 text-sm ${app.clicked ? "text-white bg-blue-700" : ""}`}>{app.name}</h4>
            </div>
          </div>
        ))}
      </div>
      <div className="w-screen bg-[#BBC2C2] h-[4vh] flex justify-between">
        <div
          className={`absolute h-[70vh] w-[25vw] bg-[#BBC2C2] shadow shadow-black rounded-sm border-2 border-black border-b-white border-r-white grid grid-flow-row grid-cols-1 grid-rows-7 rotate-180 origin-top z-30 ${
            clickedStart ? "" : "hidden"
          }`}
        >
          <div className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left">
            <img className="h-16 mx-3" src="./log-out.png" alt="" />
            <h1 className="m-auto w-full">Log Out</h1>
          </div>
          <div className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left">
            <img className="h-20" src="./change-comp.png" alt="" />
            <h1 className="m-auto w-full">Change Computer</h1>
          </div>
          <div className="border-2 w-full h-1 bg-transparent border-t-white border-b-black opacity-25 "></div>
          <div className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left">
            <img className="h-20" src="./mycomputer.png" alt="" />
            <h1 className="m-auto w-full">-</h1>
          </div>
          <div className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left">
            <img className="h-20" src="./mycomputer.png" alt="" />
            <h1 className="m-auto w-full">-</h1>
          </div>
          <div className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left">
            <img className="h-20" src="./mycomputer.png" alt="" />
            <h1 className="m-auto w-full">-</h1>
          </div>
          <div className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left">
            <img className="h-20" src="./mycomputer.png" alt="" />
            <h1 className="m-auto w-full">-</h1>
          </div>
          <div className=" hover:bg-blue-900 hover:text-white rotate-180 flex text-left">
            <img className="h-20" src="./mycomputer.png" alt="" />
            <h1 className="m-auto w-full">-</h1>
          </div>
        </div>
        <h1
          className={`text-center my-auto shadow shadow-black ${
            clickedStart ? "border-b-white border-r-white" : "border-t-white border-l-white"
          } font-semibold border-2 border-black  rounded-sm p-1 px-4 m-1 text-sm`}
          onClick={() => {
            setClickedStart(!clickedStart);
          }}
        >
          Start
        </h1>
        <h1 className="text-center my-auto px-2 mx-1 border-2 shadow shadow-black border-black border-b-white border-r-white">
          9:00 AM
        </h1>
      </div>
    </main>
  );
};

export default page;
