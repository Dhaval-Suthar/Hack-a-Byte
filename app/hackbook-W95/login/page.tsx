"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/lib/actions";

const page = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please fill in the username and password");
      return;
    }

    const response = await login(username, password);

    setUsername("");
    setPassword("");

    if (response.error) {
      alert(response.error);
      return;
    }

    if (!response.id || !response.data) {
      alert("Sorry! Some Error Occured!");
      return;
    }

    const userData = JSON.parse(response.data);

    // if(userData.computerModels.includes("hackbook-W95")){ 
    //   localStorage.setItem("userId", response.id);
    //   router.push("/hackbook-W95");
    // }
    // else{
    //   alert("Buy hackbook-W95 to access!");
    // }

    localStorage.setItem("userId", response.id);
    router.push("/hackbook-W95");
    
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
            <div
              onClick={() => router.push("/")}
              className="bg-[#BBC2C2] h-7 w-7 m-0.5 hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black border-2 shadow shadow-black border-black border-t-white border-l-white"
            >
              X
            </div>
          </div>
        </div>
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="flex">
              <div className="flex p-1">
                <h1 className="underline">P</h1>
                <h1>assword: </h1>
              </div>
              <input
                type="password"
                className="bg-white h-8 w-40 mx-10 border-2 shadow shadow-black border-black border-b-white border-r-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="w-1/5 h-full  flex flex-col justify-start">
            <div
              onClick={handleLogin}
              className="bg-[#BBC2C2] h-7 w-32 mx-10 my-5 text-center hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black border-2 shadow shadow-black border-black border-t-white border-l-white"
            >
              OK
            </div>
            <div
              onClick={() => router.push("/")}
              className="bg-[#BBC2C2] h-7 w-32 mx-10 text-center hover:border-b-white  hover:border-r-white hover:border-l-black hover:border-t-black  border-2 shadow shadow-black border-black border-t-white border-l-white"
            >
              Cancel
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default page;
