"use client";

import React, { useState } from "react";

const page = () => {

  return (
    <main className="bg-[#008080] h-screen w-screen flex justify-center ">
      <div className="bg-[#BBC2C2] h-80 w-[70vw] m-40  border-2 shadow shadow-black border-black border-t-white border-l-white">
        <div className="w-auto h-8 bg-blue-900  m-1 flex justify-between">
          <h1 className="text-xl text-white font-semibold justify-self-start mx-2">Welcome to Hackbook-W95</h1>
          <div className="flex text-center font-extrabold text-xl">
            <div className="bg-[#BBC2C2] h-7 w-7 m-0.5  border-2 shadow shadow-black border-black border-t-white border-l-white">
              ?
            </div>
            <div className="bg-[#BBC2C2] h-7 w-7 m-0.5  border-2 shadow shadow-black border-black border-t-white border-l-white">
              X
            </div>
          </div>
        </div>
        <div className="w-auto h-64  flex m-1">
          <div className="w-1/5 h-full ">
            <img src="/key.png" alt="" />
          </div>
          <div className="w-3/5 h-full  flex flex-col justify-around">
            <h1>Type a user name and password to log on to hackbook-W95</h1>
            <div className="flex">
              <div className="flex p-1">
                <h1 className="underline">U</h1>
                <h1>sername: </h1>
              </div>
              <input className="bg-white h-8 w-40 mx-10 border-2 shadow shadow-black border-black border-b-white border-r-white"></input>
            </div>
            <div className="flex">
              <div className="flex p-1">
                <h1 className="underline">P</h1>
                <h1>assword: </h1>
              </div>
              <input className="bg-white h-8 w-40 mx-10 border-2 shadow shadow-black border-black border-b-white border-r-white"></input>
            </div>
          </div>
          <div className="w-1/5 h-full  flex flex-col justify-start">
            <div className="bg-[#BBC2C2] h-7 w-32 mx-10 my-5 text-center  border-2 shadow shadow-black border-black border-t-white border-l-white">
              OK
            </div>
            <div className="bg-[#BBC2C2] h-7 w-32 mx-10 text-center  border-2 shadow shadow-black border-black border-t-white border-l-white">
              Cancel
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default page;
