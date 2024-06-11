"use client";

import { useEffect, useState } from "react";
import { execute } from "@/app/lib/commands";
import { useFormState, useFormStatus } from "react-dom";
import { DEFAULT_COMPUTER_MODEL, ROOT_DIRECTORY, CONFIRMATIONS, MODELS } from "../../lib/constants";
import clsx from "clsx";

export default function Console({ user, device }: { user: string, device: string}) {
  // Computer Information
  const [computerModel, setComputerModel] = useState(DEFAULT_COMPUTER_MODEL);
  const [presentWorkingDiractory, setPresentWorkingDiractory] = useState(ROOT_DIRECTORY);

  // Terminal Information
  const prompt = `${user}@${computerModel} ${presentWorkingDiractory} % `;
  const executeWithPrompt = execute.bind(null, prompt, device);
  const [state, dispatch] = useFormState(executeWithPrompt, {});
  const [commands, setCommands] = useState([""]);
  const [index, setIndex] = useState(0);

  // Function to print the output to the console
  function printOutput(output: string) {
    const consoleElement = document.getElementById("console");
    const outputElement = document.createElement("li");

    outputElement.innerHTML = output;
    consoleElement?.appendChild(outputElement);
  }

  // Function to remove element from the console
  function removeElement(element: HTMLElement) {
    const consoleElement = document.getElementById("console");

    element && consoleElement?.removeChild(element);
  }

  // Function to add element to the console
  function addElement(element: HTMLElement) {
    const consoleElement = document.getElementById("console");
    element && consoleElement?.appendChild(element);
  }

  // Function to clear the console
  function clearConsole() {
    const consoleElement = document.getElementById("console");

    if (consoleElement === null) return;

    while (consoleElement.childNodes.length > 2) {
      consoleElement.removeChild(consoleElement.children[1]); // so that it doesnt clear the top line and command line
    }

    consoleElement.appendChild(document.createElement("h1")); // Adds a h1 tag as the console should have atleast one line

    consoleElement.removeChild(consoleElement.children[0]); // clears the 'clear' command
  }

  // Function to ask for password
  function askFor(element: string) {
    const inputElement = document.getElementById(element) as HTMLInputElement;
    inputElement.value = "";
    inputElement.focus();

    // Focus passwordInputElement for every key down
    window.addEventListener("keydown", () => {
      inputElement.focus();
    });
    window.addEventListener("click", () => {
      inputElement.focus();
    });
  }

  useEffect(() => {
    const promptElement = document.getElementById("command-prompt") as HTMLElement;
    const commandLineElement = document.getElementById("command-line") as HTMLTextAreaElement;

    removeElement(promptElement);
    if (!state.require && !state.confirm) printOutput(state.command || "");
    printOutput(state.message || state.error || "");
    commandLineElement && (commandLineElement.value = prompt);
    addElement(promptElement);
    commandLineElement?.focus();

    if (state.require?.includes("password")) {
      askFor("password");
    }

    if (state.require === "amount") {
      askFor("amount");
    }

    if (state.username) {
      user = state.username;
    }

    if (state.confirm) {
      askFor("confirmation");
    }

    if (state.clear) {
      clearConsole();
    }
  }, [state]);

  return (
    <main className=" bg-zinc-900 text-white w-full h-full">
      <ul id="console" className="w-full h-full">
        <li id="command-prompt" className="w-full h-full">
          <form action={dispatch} className="w-full h-full">
            {state.require === "amount" && (
              <>
                <h3>{state.command}</h3>
                <div className="flex">
                  <label htmlFor="amount" className="">
                    Amount:{" "}
                  </label>
                  <input id="amount" name="amount" className="bg-transparent outline-none mx-2 w-full" type="number" />
                </div>
              </>
            )}
            {state.confirm && (
              <>
                <h3>{state.command}</h3>
                <h3>{CONFIRMATIONS[state.confirm as keyof typeof CONFIRMATIONS]}</h3>
                <div className="flex">
                  <label htmlFor="confirmation" className="">
                    Are You Sure? (y/n) :{" "}
                  </label>
                  <input
                    id="confirmation"
                    name="confirmation"
                    className="bg-transparent outline-none mx-2 w-8"
                    maxLength={3}
                    type="text"
                  />
                </div>
              </>
            )}
            {state.require?.includes("password") && (
              <>
                <h3>{state.command}</h3>
                <label htmlFor="password" className="flex">
                  {state.require}:
                  <div className="w-4 h-5 rounded-md bg-gray-400 flex justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 -rotate-45 m-auto text-black"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 0 0-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5A.75.75 0 0 0 9 19.5V18h1.5a.75.75 0 0 0 .53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </label>
                <input id="password" type="password" name="password" className="opacity-0 w-0 outline-none" />
              </>
            )}
            {!state.require && !state.confirm && (
              <>
                <textarea
                  name="command"
                  id="command-line"
                  className="bg-transparent outline-none w-full h-full"
                  onChange={(e) => {
                    if (e.target.value.length < prompt.length) {
                      e.target.value = prompt;
                    } else if (e.target.value.slice(0, prompt.length) !== prompt) {
                      e.target.value = prompt;
                    }

                    let value = e.target.value.slice(prompt.length);
                    commands[commands.length - 1] = value;
                  }}
                  onFocus={(e) => {
                    let value = e.target.value.slice(prompt.length);
                    commands[commands.length - 1] = value;
                  }}
                  defaultValue={prompt}
                  onKeyDown={(e) => {
                    const inputElement = e.target as HTMLInputElement;

                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (commands[commands.length - 1] !== "") {
                        commands.push("");
                      }
                      const inputElement = e.target as HTMLInputElement;
                      commands[commands.length - 1] = inputElement.value.slice(prompt.length);

                      setIndex(commands.length - 1);
                      document.getElementById("submit")?.click();
                    } else if (e.key === "ArrowUp" && index > 0) {
                      e.preventDefault();
                      inputElement.value = prompt + commands[index - 1];
                      setIndex(index - 1);
                    } else if (e.key === "ArrowDown" && index < commands.length - 1) {
                      e.preventDefault();
                      inputElement.value = prompt + commands[index + 1];
                      setIndex(index + 1);
                    }
                  }}
                />
              </>
            )}
            <button className="hidden" type="submit" id="submit"></button>
          </form>
        </li>
      </ul>
    </main>
  );
}
