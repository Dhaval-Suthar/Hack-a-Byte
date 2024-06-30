"use client";

import { useState, useEffect, use } from "react";
import { getClient } from "@botpress/webchat";

const clientId = "59b21451-5ede-47c5-90b5-84d38fb650a7";

export default function Bot() {
  const [activeBot, setActiveBot] = useState(false);
  const client = getClient({ clientId });
  client.connect();

  client.on("message", (response) => {
    const container = document.getElementById("message-container");
    const message = document.createElement("li");

    // @ts-ignore
    message.innerText = response.payload.block.text;
    message.className = "bg-gray-200 text-gray-800 p-2 px-3 m-1 rounded-2xl rounded-bl-none text-left mr-auto";

    container?.append(message);
  });

  const sendMessage = async (text: string) => {
    const container = document.getElementById("message-container");
    const message = document.createElement("li");

    message.innerText = text;
    message.className = "bg-violet-700 text-white p-2 px-3 m-1 rounded-2xl rounded-br-none text-right ml-auto";
    container?.append(message);

    await client.sendMessage(text);
  };

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
    <div className="h-16 w-16 fixed right-0 bottom-0 m-10 z-20">
      <button onClick={() => setActiveBot(!activeBot)}>
        <img src="../bot.png" alt="assitant" className="absolute z-10 hover:scale-110 duration-500" />
      </button>

      <div className="absolute w-20">
        <div
          className={`absolute ${
            activeBot && "rotate-180 scale-y-100"
          } w-96 duration-1000 scale-y-0 pointer-events-none transition-all right-0 mr-1 origin-top h-[85vh] text-black bg-zinc-100 rounded-lg overflow-y-auto overflow-hidden hide-scrollbar`}
          id="commandList"
        >
          <div className="w-full h-full origin-center rotate-180 pointer-events-auto text-sm flex justify-between flex-col">
            <ul id="message-container" className="flex flex-col overflow-y-auto">
              <li>
                <img src="../bot.png" alt="assitant" className="my-5 h-20 w-20 m-auto" />
                <h3 className="my-auto text-lg text-gray-600  w-full text-center">Robo</h3>
              </li>
            </ul>

            <input
              className="m-2 h-12 text-lg rounded-full p-2 outline-none border border-gray-300"
              placeholder="ask..."
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage(event.currentTarget.value);
                  event.currentTarget.value = "";
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
