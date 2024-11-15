"use client";

import { useEffect, useRef, useState } from "react";
import { execute } from "@/app/lib/actions";
import { useFormState, useFormStatus } from "react-dom";
import { DefaultValues } from "../../lib/constants";
import { ProcessState } from "@/app/lib/definitions";
import { useRouter } from "next/navigation";

export default function Console({ model }: { model: string }) {
  const router = useRouter();
  const localStorage = typeof window !== "undefined" ? window.localStorage : null;

  // User Information
  const [username, setUsername] = useState(
    localStorage?.getItem("user-" + model) || (DefaultValues.USERNAME as string)
  );

  // Computer Information
  const [presentWorkingDirectory, setPresentWorkingDirectory] = useState(DefaultValues.ROOT_DIRECTORY);

  // Terminal Information
  const prompt = `${username}@${model} ${presentWorkingDirectory} % `;

  const [processState, process] = useFormState(execute, new ProcessState({}).toPlainObject() as ProcessState);
  // TODO: const { pending, data, method, action } = useFormStatus();

  // Used Command History
  const [commandHistory] = useState([""]);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([] as string[]);

  // References
  const historyElement = useRef<HTMLDivElement>(null);
  const commandLineElement = useRef<HTMLTextAreaElement>(null);
  const passwordInputElement = useRef<HTMLInputElement>(null);
  const amountInputElement = useRef<HTMLInputElement>(null);
  const confirmationInputElement = useRef<HTMLInputElement>(null);

  // Functions related to the terminal
  function handleValueChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;

    // Prevent the user from editing the prompt
    if (value.length < prompt.length) {
      e.target.value = prompt;
    } else if (value.slice(0, prompt.length) !== prompt) {
      e.target.value = prompt;
    }

    // Update the value of command in commandHistory
    commandHistory[commandHistory.length - 1] = value.slice(prompt.length);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const inputElement = e.target as HTMLInputElement;
    if (e.key === "Enter") {
      e.preventDefault();

      // Update the value of command in commandHistory
      commandHistory[commandHistory.length - 1] = inputElement.value.slice(prompt.length);

      // Handle the case where the user presses enter without typing anything
      if (commandHistory[commandHistory.length - 1] !== "") {
        commandHistory.push("");
        setIndex(commandHistory.length - 2);
      }

      document.getElementById("submitButton")?.click();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index > -1) {
        inputElement.value = prompt + commandHistory[index];
        if (index > 0) setIndex(index - 1);
      }
    } else if (e.key === "ArrowDown" && index < commandHistory.length - 1) {
      e.preventDefault();
      inputElement.value = prompt + commandHistory[index + 1];
      if (index < commandHistory.length - 2) setIndex(index + 1);
    } else if (e.key === "ArrowLeft") {
      if (inputElement.selectionStart || 0 <= prompt.length + 1) {
        inputElement.setSelectionRange(prompt.length + 1, prompt.length + 1);
      }
    } else if (e.key === "Tab") {
      // inputElement.value = prompt + commandHistory[index]; TODO: Implement tab completion
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLTextAreaElement>) {
    commandHistory[commandHistory.length - 1] = e.target.value.slice(prompt.length);
  }

  // Functions related to the process
  function askFor(inputElement: HTMLInputElement) {
    inputElement.value = "";
    inputElement.focus();

    // Focus InputElement for every key down
    window.addEventListener("keydown", () => {
      inputElement.focus();
    });
    window.addEventListener("click", () => {
      inputElement.focus();
    });
  }

  function reset(element: HTMLTextAreaElement) {
    element.value = prompt;
    element.focus();
    element.setSelectionRange(prompt.length, prompt.length);
  }

  function handleRequirements(requires: string) {
    switch (requires) {
      case "amount":
        askFor(amountInputElement.current as HTMLInputElement);
        break;
      case "confirmation":
        askFor(confirmationInputElement.current as HTMLInputElement);
        break;

      default:
        if (requires.includes("password")) {
          askFor(passwordInputElement.current as HTMLInputElement);
        }
    }
  }

  function handleNewLogin(username: string) {
    commandLineElement.current &&
      (commandLineElement.current.value = `${username}@${model} ${presentWorkingDirectory} % `);
    setUsername(username);
    localStorage?.setItem("user-" + model, username);
  }

  function handleHistory() {
    history.push(processState.command as string);

    if (processState.error) {
      processState.error.split("\n").forEach((error) => {
        history.push(error); // TODO: Change this to error message
      });
    } else if (processState.message) {
      processState.message.split("\n").forEach((message) => {
        history.push(message);
      });
    }
    setHistory([...history]);
  }

  function handleProcess() {
    if (commandLineElement.current) reset(commandLineElement.current as HTMLTextAreaElement);

    if (processState.requires) return handleRequirements(processState.requires);

    if (processState.newlogin.username != "") handleNewLogin(processState.newlogin.username);

    if (processState.clear) return setHistory([]);

    if (processState.shutdown) {
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }

    handleHistory();
  }

  useEffect(() => {
    handleProcess();
  }, [processState]);

  return (
    <main className={"h-full text-white"}>
      <div ref={historyElement}>
        {history.map((output, index) => (
          <p key={index}>{output}</p>
        ))}
      </div>
      <form action={process} className="w-full h-full">
        {processState.requires === "amount" && (
          <>
            <h3>{processState.command}</h3>
            <div className="flex">
              <label htmlFor="amount" className="">
                Amount:{" "}
              </label>
              <input
                ref={amountInputElement}
                id="amount"
                name="amount"
                className="bg-transparent outline-none mx-2 w-full"
                type="number"
              />
            </div>
          </>
        )}
        {processState.requires === "confirmation" && (
          <>
            <h3>{processState.command}</h3>
            <h3>{processState.message}</h3>
            <div className="flex">
              <label htmlFor="confirmation" className="">
                Are You Sure? (y/n) :{" "}
              </label>
              <input
                ref={confirmationInputElement}
                id="confirmation"
                name="confirmation"
                className="bg-transparent outline-none mx-2 w-8"
                maxLength={3}
                type="text"
              />
            </div>
          </>
        )}
        {processState.requires?.includes("password") && (
          <>
            <h3>{processState.command}</h3>
            <label htmlFor="password" className="flex">
              {processState.requires}:
              <div className="w-4 h-5 rounded-md bg-gray-400 flex justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 -rotate-45 m-auto text-black"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 0 0-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5A.75.75 0 0 0 9 19.5V18h1.5a.75.75 0 0 0 .53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </label>
            <input
              ref={passwordInputElement}
              id="password"
              type="password"
              name="password"
              className="opacity-0 w-0 outline-none"
            />
          </>
        )}
        {!processState.requires && !processState.shutdown && (
          <textarea
            ref={commandLineElement}
            name="command"
            id="command-line"
            spellCheck="false"
            className="bg-transparent outline-none resize-none w-full h-screen"
            onChange={handleValueChange}
            onFocus={handleFocus}
            defaultValue={prompt}
            onKeyDown={handleKeyDown}
          />
        )}

        <button className="hidden" type="submit" id="submitButton"></button>
      </form>
    </main>
  );
}
