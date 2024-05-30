"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { dec2bin } from "../lib/utils";
import { useFormState, useFormStatus } from "react-dom";
import { authenticate, signup } from "@/app/lib/actions";

export default function Page() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);
  const [signupMessage, signupDispatch] = useFormState(signup, undefined);

  // Theme Related
  const [theme, setTheme] = useState(0);
  const Backgrounds = [
    "url('./background/img0.jpg')",
    "url('./background/img1.jpg')",
    "url('./background/img2.jpg",
    "url('./background/img3.jpg')",
    "url('./background/img4.jpg')",
    "url('./background/img5.jpg')",
    "url('./background/img6.jpg')",
    "url('./background/img7.jpg')",
  ];

  // Panel Related
  const [method, setMethod] = useState("none");

  // Moving Bytes Related
  const [number, setNumber] = useState(100);
  const [move, setMove] = useState(false);

  useEffect(() => {
    setInterval(() => {
      // Set the number to a random number
      setNumber(Math.floor(Math.random() * 1000));
    }, 1000);

    // Move the bytes at start
    setMove(!move);
  }, []);

  // Move the bytes every 10 seconds
  setTimeout(() => {
    setMove(!move);
  }, 10000);

  return (
    <>
      <div
        style={{
          backgroundImage: Backgrounds[theme],
          backgroundSize: theme > 5 ? "auto" : "cover",
        }}
        className=" w-screen h-screen"
      >
        <div className="absolute h-screen w-screen flex">
          <div
            id="Panel"
            className="h-[27rem] md:h-[26rem] lg:h-[25rem] xl:h-80 w-[80vw] sm:w-1/3 justify-center m-auto z-20 shadow shadow-zinc-600 rounded-sm"
          >
            <div className="bg-zinc-800/95 w-full h-8 rounded-t-md"></div>
            <div className="bg-black/80 h-full w-full rounded-b-md text-white ">
              <h1 className=" text-center w-full text-2xl p-2"> &gt; Welcome to Hack a byte_ </h1>
              <h3 className="px-2"> Select one </h3>
              <div className="text-left px-3 w-full text-md flex">
                {" "}
                -{" "}
                <h3
                  className="hover:underline px-2 cursor-pointer"
                  onClick={() => {
                    setMethod("login");
                  }}
                >
                  LogIn
                </h3>
                {method === "login" && <div className="h-2 w-2 my-2 bg-pink-800 rounded-full"></div>}
              </div>
              <div className=" text-left px-3 w-full text-md flex">
                {" "}
                -{" "}
                <h3
                  className="hover:underline px-2 cursor-pointer"
                  onClick={() => {
                    setMethod("signup");
                  }}
                >
                  SignUp
                </h3>
                {method === "signup" && <div className="h-2 w-2 my-2 bg-pink-800 rounded-full"></div>}
              </div>
              <div className=" text-left px-3 w-full text-md flex">
                {" "}
                -{" "}
                <h3
                  className="hover:underline px-2 cursor-pointer"
                  onClick={() => {
                    setMethod("overview");
                  }}
                >
                  Overview
                </h3>
                {method === "overview" && <div className="h-2 w-2 my-2 bg-pink-800 rounded-full"></div>}
              </div>
              {method === "login" && (
                <form action={dispatch}>
                  <h3 className="p-2 pb-0">
                    Username: <input name="username" className="bg-transparent outline-none" type="text" />
                  </h3>
                  <h3 className="p-2 pt-0">
                    Password: <input name="password" className="bg-transparent outline-none" type="password" />
                  </h3>
                  <button type="submit" className="px-4 hover:underline">
                    submit
                  </button>
                  {/* <h3 className="p-2 pt-1">logging / ...</h3> */}
                </form>
              )}
              {method === "signup" && (
                <form action={signupDispatch}>
                  <h3 className="p-2 pb-0">
                    Username: <input name="username" className="bg-transparent outline-none" type="text" />
                  </h3>
                  <h3 className="px-2">
                    Email: <input name="email" className="bg-transparent outline-none" type="email" />
                  </h3>
                  <h3 className=" px-2">
                    Password: <input name="password" className="bg-transparent outline-none" type="password" />
                  </h3>
                  <h3 className="p-2 pt-0">
                    Confirm Password:{" "}
                    <input name="confirm-password" className="bg-transparent outline-none" type="password" />
                  </h3>
                  <button type="submit" className="px-4 hover:underline">
                    submit
                  </button>
                  {/* <h3 className="p-2 pt-1">signing / ...</h3> */}
                </form>
              )}
              {method === "overview" && (
                <>
                  <div className="p-2 flex">
                    <h2 className="md:pr-4">Select Theme:</h2>
                    <div className="w-full md:w-2/3 h-24  grid   grid-rows-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className={clsx("hover:underline cursor-pointer", {
                            "underline text-pink-800": theme === i,
                          })}
                          onClick={() => {
                            setTheme(i);
                          }}
                        >
                          Theme{i}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="absolute h-screen w-screen overflow-hidden">
          <h4
            style={{
              textShadow: "0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 100px #00ff00",
              transitionDuration: "9s",
              transitionDelay: "1s",
            }}
            className={clsx(
              "text-[#00ff00] transition-all relative text-4xl bytes text-start w-screen h-1/6 break-words p-2 select-nonse cursor-default",
              {
                "-translate-x-96": !move,
                "translate-x-[120vw]": move,
              }
            )}
          >
            {
              // loop 11 times
              Array.from({ length: 11 - dec2bin(number + 500).length }).map((_, i) => 0)
            }
            {dec2bin(number + 500)}
          </h4>
          <h4
            style={{
              textShadow: "0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 100px #00ff00",
              transitionDuration: "6s",
              transitionDelay: "4s",
            }}
            className={clsx(
              "text-[#00ff00] transition-all relative text-4xl bytes text-end w-screen h-1/6 break-words p-2 select-nonse cursor-default",
              {
                "translate-x-96": !move,
                "-translate-x-[120vw]": move,
              }
            )}
          >
            {
              // loop 11 times
              Array.from({ length: 11 - dec2bin(number + 100).length }).map((_, i) => 0)
            }
            {dec2bin(number + 100)}
          </h4>
          <h4
            style={{
              textShadow: "0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 100px #00ff00",
              transitionDuration: "8s",
              transitionDelay: "2s",
            }}
            className={clsx(
              "text-[#00ff00] transition-all relative text-4xl bytes text-start w-screen h-1/6 break-words p-2 select-nonse cursor-default",
              {
                "-translate-x-96": !move,
                "translate-x-[120vw]": move,
              }
            )}
          >
            {
              // loop 11 times
              Array.from({ length: 11 - dec2bin(number).length }).map((_, i) => 0)
            }
            {dec2bin(number)}
          </h4>
          <h4
            style={{
              textShadow: "0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 100px #00ff00",
              transitionDuration: "3s",
              transitionDelay: "7s",
            }}
            className={clsx(
              "text-[#00ff00] transition-all relative text-4xl bytes text-start w-screen h-1/6 break-words p-2 select-nonse cursor-default",
              {
                "-translate-x-96": !move,
                "translate-x-[120vw]": move,
              }
            )}
          >
            {
              // loop 11 times
              Array.from({ length: 11 - dec2bin(number + 200).length }).map((_, i) => 0)
            }
            {dec2bin(number + 200)}
          </h4>
          <h4
            style={{
              textShadow: "0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 100px #00ff00",
              transitionDuration: "2s",
              transitionDelay: "8s",
            }}
            className={clsx(
              "text-[#00ff00] transition-all relative text-4xl bytes text-start w-screen h-1/6 break-words p-2 select-nonse cursor-default",
              {
                "-translate-x-96": !move,
                "translate-x-[120vw]": move,
              }
            )}
          >
            {
              // loop 11 times
              Array.from({ length: 11 - dec2bin(number + 300).length }).map((_, i) => 0)
            }
            {dec2bin(number + 300)}
          </h4>
          <h4
            style={{
              textShadow: "0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 100px #00ff00",
              transitionDuration: "4s",
              transitionDelay: "6s",
            }}
            className={clsx(
              "text-[#00ff00] transition-all relative text-4xl bytes text-start w-screen h-1/6 break-words p-2 select-nonse cursor-default",
              {
                "-translate-x-96": !move,
                "translate-x-[120vw]": move,
              }
            )}
          >
            {
              // loop 11 times
              Array.from({ length: 11 - dec2bin(number + 600).length }).map((_, i) => 0)
            }
            {dec2bin(number + 600)}
          </h4>
        </div>
      </div>
    </>
  );
}
