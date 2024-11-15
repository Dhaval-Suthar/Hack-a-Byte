"use client";

import { useState, useEffect } from "react";
import { COMMANDS } from "../../lib/commands";

export default function Bot() {
  const [activeBot, setActiveBot] = useState(false);

  function setCommand(command: string) {
    const commandLineElement = document.getElementById("command-line") as HTMLTextAreaElement;
    const lastIndex = commandLineElement.value.indexOf("%") + 2;
    commandLineElement.value = commandLineElement.value.slice(0, lastIndex) + command;
    commandLineElement?.focus();
    setActiveBot(false);
  }

  useEffect(() => {
    if (activeBot) {
      document.getElementById("leaderboard")?.classList.add("translate-x-full");
    } else {
      document.getElementById("leaderboard")?.classList.remove("translate-x-full");
    }
  }, [activeBot]);

  return (
    <div className="h-16 w-16 fixed right-0 bottom-0 m-10 z-20 ">
      <button onClick={() => setActiveBot(!activeBot)}>
        <img src="/bot.png" alt="assitant" className="absolute z-10 hover:scale-110 duration-500" />
      </button>
      <div className="absolute w-20">
        <div
          className={`absolute ${
            activeBot && "rotate-180"
          } w-60 duration-1000 transition-all right-0 mr-1 origin-top h-[85vh] text-black bg-transparent`}
          id="commandList"
        >
          <div className="rotate-180 h-[85vh] overflow-y-auto overflow-hidden hide-scrollbar">
            {Object.keys(COMMANDS).map((commandName) => (
              <div
                key={commandName}
                className={`${
                  !activeBot && "scale-0"
                } text-center flex justify-center my-8 text-2xl transition-all duration-1000`}
              >
                <h1
                  onClick={() => {
                    setCommand(commandName);
                  }}
                  className="w-[28vw] h-10 p-2 text-lg rounded-full transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-green-600 shadow-lg shadow-green-700 back text-zinc-100"
                >
                  {commandName}
                </h1>
                <div className="h-2 flex flex-col mx-1">
                  <h3
                    onClick={() => {
                      setCommand("help " + commandName);
                    }}
                    className="w-5 h-5 m-3 bg-blue-800 rounded-full text-sm text-white shadow-sm shadow-zinc-700 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    i
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
