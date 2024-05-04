"use client";

import { useState } from "react";
import { COMMANDS } from "../lib/Command";
import { focusCommandLine } from "@/app/lib/utils";
import { askForPassword } from "../lib/utils";
import Bot from "../ui/hackbook-L/bot";
import {
  DEFAULT_USERNAME,
  DEFAULT_USER_ID,
  DEFAULT_COMPUTER_MODEL,
  ROOT_DIRECTORY,
  DEFAULT_PASSWORD,
} from "../lib/constants";

export default function Page() {
  // User Information
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [userId, setUserId] = useState(DEFAULT_USER_ID);

  // Computer Information
  const [computerModel, setComputerModel] = useState(DEFAULT_COMPUTER_MODEL);
  const [presentWorkingDiractory, setPresentWorkingDiractory] = useState(ROOT_DIRECTORY);

  // Terminal Information
  const prompt = `${username}@${computerModel} ${presentWorkingDiractory} % `;
  const [command, setCommand] = useState("");
  const commandToPerform = command.split(" ")[0];
  const argumentList = command.split(" ").slice(1);

  // Command Information
  const [prevCommands, setPrevCommands] = useState<string[]>([]); 
  const [index, setIndex] = useState(0); 
  const [backupCommand, setBackupCommand] = useState("");
  const [argumentSuggestion, setArgumentSuggestion] = useState("");
  let password = DEFAULT_PASSWORD;

  // Functions
  function printCommand() {
    const consoleElement = document.getElementById("console-element");
    const commandElement = document.createElement("li");

    commandElement.innerHTML = prompt + command;
    consoleElement?.appendChild(commandElement);
  }

  async function executeCommand() {
    // Loading Information
    let loading = false;
    const loadingElement = document.createElement("li");
    loadingElement.innerHTML = "processing";

    // Document Elements
    const consoleElement = document.getElementById("console-element");
    const promptElement = document.getElementById("command-prompt");
    const outputElement = document.createElement("li");

    // Remove prompt
    promptElement && consoleElement?.removeChild(promptElement);

    const commandInfo = COMMANDS[commandToPerform as keyof typeof COMMANDS];

    // Save Command to history and Reset Index
    if (prevCommands.length < 10) {
      setPrevCommands((prevcmds) => [command, ...prevcmds]);
    } else {
      let tempArray = prevCommands.slice(0, prevCommands.length - 1);
      setPrevCommands([command, ...tempArray]);
    }
    setIndex(0);

    async function checkInputs() {
      if (!commandInfo) {
        return `<h3>command not found: ${commandToPerform} </h3>`;
      }

      const argumentRequiredList = commandInfo.argumentsRequired === "" ? [] : commandInfo.argumentsRequired.split(" ");

      if (userId === DEFAULT_USER_ID && commandInfo.requiresLogin) return `<h3>Login First</h3>`;

      if (argumentList.length < argumentRequiredList.length)
        return `<h3> - Usage: ${commandToPerform} ${commandInfo.argumentsRequired}</h3>`;

      if (commandInfo.containsNumberAt && !Number(argumentList[commandInfo.containsNumberAt - 1]))
        return `<h3 class="text-red-800">amount should be only numbers</h3>`;

      if (commandInfo.containsNumberAt && argumentList[commandInfo.containsNumberAt - 1].length < 1)
        return `<h3>amount should be greater than 0</h3>`;

      if (commandInfo.requiresConfirmation) {
        const confirmed = await askForConfirmation();
        if (!confirmed) return `<h3 class="text-red-800">Operation Cancelled.</h3>`;
      }

      if (commandInfo.requiresPassword) {
        password = await askForPassword(commandInfo.passwordType);
      }

      if (commandInfo.hidden)
        return (
          await commandInfo.action({
            userId: userId,
            username: username,
            password: password,
            command: commandToPerform,
            argumentList: argumentList,
          })
        ).output;

      if (!Number(password)) return `<h3 class="text-red-800">password should be only numbers</h3>`;

      if (password.length !== 4) return `<h3 class="text-red-800"> password should have 4 digits</h3>`;

      // Start loading
      loadingElement.innerHTML = `<h3>${commandInfo.loadingText}</h3>`;
      consoleElement?.appendChild(loadingElement);
      loading = true;

      // Get the result of the command
      const result = await commandInfo.action({
        userId: userId,
        username: username,
        password: password,
        command: commandToPerform,
        argumentList: argumentList,
      });

      // Set userData if provided
      if (result.userData) {
        setUsername(result.userData.username);
        setUserId(result.userData.id);
      }

      password = DEFAULT_PASSWORD;

      return result.output;
    }

    outputElement.innerHTML = await checkInputs();

    if (loading) {
      // End loading
      consoleElement?.removeChild(loadingElement);
    }

    // Clear Command
    setCommand("");

    // Print output
    consoleElement?.appendChild(outputElement);

    // Print prompt
    promptElement && consoleElement?.appendChild(promptElement);

    focusCommandLine();
  }

  async function askForConfirmation() {
    const confirmationElement = document.createElement("li");
    const confirmationInfoElement = document.createElement("li");
    const consoleElement = document.getElementById("console-element");
    const confirmationInputElement = document.createElement("input");

    function focusInput() {
      confirmationInputElement.focus(); // Focus the input
    }

    // Properties of confirmationInputElement
    confirmationInputElement.type = "text";
    confirmationInputElement.style.background = "transparent";
    confirmationInputElement.style.marginLeft = "10px";
    confirmationInputElement.style.width = "30px";
    confirmationInputElement.maxLength = 3;
    confirmationInputElement.style.outline = "none";

    // Properties of confirmationElement
    confirmationElement.style.display = "flex";
    confirmationInfoElement.innerHTML = COMMANDS[commandToPerform as keyof typeof COMMANDS]?.info;

    // Properties of confirmationInfoElement
    confirmationElement.style.display = "flex";
    confirmationElement.innerHTML = `<h3 class="flex">Are You Sure? (yes/no) : </h3>`;

    // Add confirmationInputElement and confirmationInfoElement
    confirmationElement.appendChild(confirmationInputElement);
    consoleElement?.appendChild(confirmationInfoElement);
    consoleElement?.appendChild(confirmationElement);

    // // Focus confirmationInputElement for every key down
    window.addEventListener("keydown", focusInput);
    window.addEventListener("click", focusInput);

    // Wait till user enters the password
    return await new Promise<boolean>(
      (resolve) =>
        (confirmationInputElement.onkeydown = (e) => {
          if (e.key === "Enter") {
            // Remove the event listeners
            window.removeEventListener("keydown", focusInput);
            window.removeEventListener("click", focusInput);

            // Remove confirmationInfoElement
            consoleElement?.removeChild(confirmationInfoElement);

            // Remove confirmationElement
            consoleElement?.removeChild(confirmationElement);

            if (confirmationInputElement.value === "yes") {
              resolve(true);
            } else {
              resolve(false);
            }
          }
        })
    );
  }

  function suggestArguments(commandName: string) {
    const commandInfo = COMMANDS[commandName as keyof typeof COMMANDS];

    if (commandInfo) setArgumentSuggestion(commandInfo.argumentsRequired + " " + commandInfo.optionalArguments);

    focusCommandLine();
  }

  return (
    <>
      <main className="min-h-screen min-w-full bg-zinc-900 text-white">
        <div>
          <ul id="console-element">
            <li id="command-prompt">
              <div>
                <textarea
                  className="bg-zinc-900 outline-none w-full absolute h-full"
                  value={prompt + command}
                  id="command-line"
                  onChange={(e) => {
                    if (e.target.value[e.target.value.length - 1] !== "\n") {
                      setCommand(e.target.value.slice(prompt.length));

                      // Update command history
                      if (index > 0) {
                        let tempArray = [...prevCommands];
                        tempArray[index - 1] = e.target.value.slice(prompt.length);
                        setPrevCommands(tempArray);
                      }
                    }
                  }}
                  // If user changes the value of the command
                  onKeyDown={(e) => {
                    const commandInfo = COMMANDS[commandToPerform as keyof typeof COMMANDS];

                    // make argumentSuggestion empty
                    if (argumentSuggestion !== "") {
                      setArgumentSuggestion("");
                    }

                    // Suggest it's arguments
                    if (commandInfo && e.key === " ") {
                      suggestArguments(command);
                    }

                    // If enter key is pressed
                    if (e.key === "Enter") {
                      printCommand();
                      executeCommand();
                    }

                    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && prevCommands.length) {
                      e.preventDefault();
                      switch (e.key) {
                        case "ArrowUp":
                          if (index === 0) {
                            setBackupCommand(command);
                          }
                          if (prevCommands[index]) {
                            setCommand(prevCommands[index]);
                            setIndex(index + 1);
                          }
                          break;
                        case "ArrowDown":
                          if (index === 1) {
                            setCommand(backupCommand);
                            setIndex(index - 1);
                          } else if (prevCommands[index - 2]) {
                            setCommand(prevCommands[index - 2]);
                            setIndex(index - 1);
                          }
                          break;
                      }
                    }
                  }}
                />
                <div className="absolute text-zinc-400 flex ml-1">
                  <h3 className="text-transparent">{prompt + command}</h3>
                  <h3>{argumentSuggestion}</h3>
                </div>
                <h3 className="absolute bg-transparent text-transparent select-none">{prompt}</h3>
              </div>
            </li>
          </ul>
        </div>
      </main>

      <Bot setCommand={setCommand} suggestArguments={suggestArguments} />
    </>
  );
}
