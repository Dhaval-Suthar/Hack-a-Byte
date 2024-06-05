"use client";

import React from "react";
import { redirect } from "next/navigation";
import { action } from "@/app/lib/actions";
import { MODELS } from "@/app/lib/constants";
import Link from "next/link";

const page = () => {
  const handleLogin = async (formData: FormData) => {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      alert("Please fill in the username and password");
      return;
    }

    const response = await action("login", { username, password }, MODELS.W95);

    if (response.error) {
      alert(response.error);
      return;
    }

    if (!response.data) {
      alert("Sorry! Some Error Occured!");
      return;
    }

    redirect("/devices/hackbook-W95");
  };

  const handleInfo = () => {
    alert("This is a simple login page. You can login with username: admin and password: admin");
  };

  return (
    <main className="bg-[#008080] h-screen w-screen flex justify-center ">
      <div className="bg-[#BBC2C2] h-80 w-[70vw] m-40  border-2 shadow shadow-black border-black border-t-white border-l-white">
        <div className="w-auto h-8 bg-blue-900  m-1 flex justify-between">
          <h1 className="text-xl text-white font-semibold justify-self-start mx-2">Welcome to hackbook-W95</h1>
          <div className="flex text-center font-extrabold text-xl">
            <div
              onClick={handleInfo}
              className="bg-[#BBC2C2] h-7 w-7 m-0.5 hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black border-2 shadow shadow-black border-black border-t-white border-l-white"
            >
              ?
            </div>
            <Link href="/dashboard">
              <div className="bg-[#BBC2C2] h-7 w-7 m-0.5 hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black border-2 shadow shadow-black border-black border-t-white border-l-white">
                X
              </div>
            </Link>
          </div>
        </div>
        <form action={handleLogin}>
          <div className="w-auto h-64  flex m-1">
            <div className="w-1/5 h-full ">
              <img src="/hackbook-W95/app-icon/key.png" alt="" />
            </div>
            <div className="w-3/5 h-full  flex flex-col justify-around">
              <h1>Type a user name and password to log on to hackbook-W95</h1>
              <div className="flex">
                <div className="flex p-1">
                  <h1 className="underline">U</h1>
                  <h1>sername: </h1>
                </div>
                <input
                  className="bg-white h-8 w-40 mx-10 border-2 shadow shadow-black border-black border-b-white border-r-white"
                  name="username"
                />
              </div>
              <div className="flex">
                <div className="flex p-1">
                  <h1 className="underline">P</h1>
                  <h1>assword: </h1>
                </div>
                <input
                  type="password"
                  name="password"
                  className="bg-white h-8 w-40 mx-10 border-2 shadow shadow-black border-black border-b-white border-r-white"
                />
              </div>
            </div>
            <div className="w-1/5 h-full  flex flex-col justify-start">
              <button
                type="submit"
                className="bg-[#BBC2C2] h-7 w-32 mx-10 my-5 text-center hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black border-2 shadow shadow-black border-black border-t-white border-l-white"
              >
                OK
              </button>
              <Link href="/dashboard">
                <div className="bg-[#BBC2C2] h-7 w-32 mx-10 text-center hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black  border-2 shadow shadow-black border-black border-t-white border-l-white">
                  Cancel
                </div>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default page;
