import React from "react";

const APPS = [
  {
    name: "Internet Explorer",
    icon: "/ie.png",
    path: "/ie",
  },
  {
    name: "My Computer",
    icon: "/mycomputer.png",
    path: "/mycomputer",
  },
  {
    name: "Recycle Bin",
    icon: "/recyclebin.png",
    path: "/recyclebin",
  },
  {
    name: "Inbox",
    icon: "/inbox.png",
    path: "/inbox",
  },
];

const page = () => {
  return (
    <main className="bg-[#008080] h-screen w-screen ">
      <div className="grid grid-cols-10 grid-rows-6 grid-flow-col w-screen h-[96vh] text-white">
        {APPS.map((app) => (
          <div className="col-span-1 row-span-1 flex justify-center">
            <div className="m-auto text-center break-words ">
              <img className="hover:bg-blue-300 bg-blend-screen h-24 w-24" src={app.icon} />
              <h4 className="w-20 text-sm">{app.name}</h4>
            </div>
          </div>
        ))}
      </div>
      <div className="w-screen bg-[#BBC2C2] h-[4vh] flex justify-between">
        <h1 className="text-center my-auto shadow-lg shadow-black rounded-sm p-2 text-sm">Log out</h1>
        <h1 className="text-center my-auto mx-2">9:00 pm</h1>
      </div>
    </main>
  );
};

export default page;
