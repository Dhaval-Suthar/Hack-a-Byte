"use client";
import { useState } from "react";
import { COMMANDS } from "./lib/Command";

// Default Values
export const DEFAULT_USERNAME = "0.0.0.0";
export const DEFAULT_USER_ID = "0";
export const DEFAULT_COMPUTER_MODEL = "HackBook-L";
export const ROOT_DIRECTORY = "~";

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

  // Bot Information
  const [activeBot, setActiveBot] = useState(false);

  // Other Information
  const [argumentSuggestion, setArgumentSuggestion] = useState("");

  // Functions
  function focusCommandLine() {
    const commandLine = document.getElementById("command-line");
    commandLine?.focus();
  }

  function printCommand() {
    const consoleElement = document.getElementById("console-element");
    const commandElement = document.createElement("li");

    commandElement.innerHTML = prompt + command;
    consoleElement?.appendChild(commandElement);
  }

  async function executeCommand(password = "") {
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

    if (commandInfo) {
      // Get the result of the command
      const result = await commandInfo.action({
        userId: userId,
        username: username,
        password: password,
        command: commandToPerform,
        argumentList: argumentList,
      });

      // Set the innerHTML of outputElement to the output of the command
      outputElement.innerHTML = result.output;

      // Set userData if provided
      if (result.userData) {
        setUsername(result.userData.username);
        setUserId(result.userData.id);
      }

      // Start loading
      loadingElement.innerHTML = `<h3>SigningUp... </h3>`;
      consoleElement?.appendChild(loadingElement);
      loading = true;
    } else {
      outputElement.innerHTML = `<h3>command not found: ${commandToPerform} </h3>`; // Default message for unknown command
    }

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

  function askForPassword() {
    const outputElement = document.createElement("li"); // Create a li element
    const consoleElement = document.getElementById("console-element"); // Getting the console element
    const promptElement = document.getElementById("command-prompt"); // Getting the command prompt element

    if (promptElement) {
      consoleElement?.removeChild(promptElement); // Remove promptElement
    }

    const input = document.createElement("input"); // Input for password

    const focusInput = () => {
      input.focus(); // Focus the input
    };

    // Properties of input
    input.type = "password";
    input.style.background = "transparent";
    input.style.color = "transparent";
    input.style.width = "0px";
    input.style.outline = "none";

    // Key listener
    input.onkeydown = (e) => {
      // If enter key is pressed
      if (e.key === "Enter") {
        window.removeEventListener("keydown", focusInput); // Remove the event listener
        window.removeEventListener("click", focusInput); // Remove the event listener

        consoleElement?.removeChild(outputElement); // Remove output

        if (promptElement) {
          consoleElement?.appendChild(promptElement); // Print promptElement
        }

        executeCommand(input.value); // Handle the command
      }
    };

    // Properties of output
    outputElement.style.display = "flex";
    outputElement.innerHTML = `
      <h3 class="flex">Password:
        <div class="w-4 h-5 rounded-md bg-gray-400 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 -rotate-45 m-auto text-black">
            <path fill-rule="evenodd" d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 0 0-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5A.75.75 0 0 0 9 19.5V18h1.5a.75.75 0 0 0 .53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z" clip-rule="evenodd" />
          </svg>
        </div>
      </h3>`;

    // Print output
    outputElement.appendChild(input);
    consoleElement?.appendChild(outputElement);

    // Focus input for every key down
    window.addEventListener("keydown", focusInput);
    window.addEventListener("click", focusInput);
  }

  function askForConfirmation() {
    const outputElement = document.createElement("li"); // Create a li element
    const info = document.createElement("li"); // Create a li element
    const consoleElement = document.getElementById("console-element"); // Getting the console element
    const promptElement = document.getElementById("command-prompt"); // Getting the command prompt element
    const commands = command.split(" "); // Separate commands and arguments from command

    promptElement && consoleElement?.removeChild(promptElement); // Remove promptElement

    const input = document.createElement("input"); // Input for confirmation

    const focusInput = () => {
      input.focus(); // Focus the input
    };

    // Properties of input
    input.type = "text";
    input.style.background = "transparent";
    input.style.marginLeft = "10px";
    input.style.width = "30px";
    input.maxLength = 3;
    input.style.outline = "none";

    // Key listener
    input.onkeydown = (e) => {
      // If enter key is pressed
      if (e.key === "Enter") {
        window.removeEventListener("keydown", focusInput); // Remove the event listener
        window.removeEventListener("click", focusInput); // Remove the event listener

        consoleElement?.removeChild(info); // Remove info

        switch (input.value) {
          case "yes":
            promptElement && consoleElement?.appendChild(promptElement); // Print promptElement
            consoleElement?.removeChild(outputElement); // Remove output
            executeCommand(); // Handle the command
            break;

          case "no":
            outputElement.innerHTML = `<h3 class="flex text-red-800">Operation Cancelled</h3>`; // Display the output in the terminal
            consoleElement?.appendChild(outputElement);
            setCommand(""); // Empty Command
            promptElement && consoleElement?.appendChild(promptElement); // Print promptElement
            break;

          default:
            outputElement.innerHTML = `<h3 class="flex text-red-800">Invalid Input</h3>`; // Display the output in the terminal
            consoleElement?.appendChild(outputElement);
            setCommand(""); // Empty Command
            promptElement && consoleElement?.appendChild(promptElement); // Print promptElement
            break;
        }
      }
    };

    // Properties of output
    outputElement.style.display = "flex";

    if (commands[0] === "ham") {
      switch (argumentList[1]) {
        case "virus":
          info.innerHTML = `<h3>That will be 1000 rupee</h3>`; // Display the output in the terminal
          consoleElement?.appendChild(info);
          break;
        default:
          setCommand(""); // Empty Command
          outputElement.innerHTML = `<h3>Software does not exists.</h3>`; // Display the output in the terminal
          consoleElement?.appendChild(outputElement);
          promptElement && consoleElement?.appendChild(promptElement); // Print promptElement
          focusCommandLine();
          return;
      }
    }

    outputElement.innerHTML = `<h3 class="flex">Are You Sure? (yes/no) : </h3>`; // Display the output in the terminal

    // Print output
    outputElement.appendChild(input);
    consoleElement?.appendChild(outputElement);

    // Focus input for every key down
    window.addEventListener("keydown", focusInput);
    window.addEventListener("click", focusInput);
  }

  function suggestArguments(commandName: string) {
    setArgumentSuggestion(COMMANDS[commandName as keyof typeof COMMANDS]?.argumentsRequired);

    focusCommandLine();
  }

  function getCommandInfo(commandName: string) {
    setCommand("help " + commandName);
    setActiveBot(false);
    focusCommandLine();
  }

  return (
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

                    if (commandInfo.requiresPassword && argumentList.length) {
                      askForPassword();
                    } else if (
                      commandInfo.requiresConfirmation &&
                      argumentList.length
                    ) {
                      askForConfirmation();
                    } else {
                      executeCommand();
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
        <div className="h-16 w-16 fixed right-0 bottom-0 m-10 z-20 ">
          <button onClick={() => setActiveBot(!activeBot)}>
            <img src="./image.png" alt="assitant" className="absolute z-10 hover:scale-110 duration-500" />
          </button>
          <div className="absolute w-20">
            <div
              className={`absolute ${
                activeBot && "rotate-180"
              } w-60 duration-1000 transition-all right-0 mr-1 origin-top h-[85vh] text-black bg-transparent overflow-y-auto overflow-hidden hide-scrollbar`}
            >
              {Object.keys(COMMANDS)
                .filter((commandName) => !COMMANDS[commandName as keyof typeof COMMANDS]?.hidden)
                .map((commandName) => (
                  <div
                    key={commandName}
                    className={`${
                      !activeBot && "scale-0"
                    } text-center rotate-180 flex justify-center my-8 text-2xl transition-all duration-1000`}
                  >
                    <h1
                      onClick={() => {
                        setCommand(commandName + " ");
                        suggestArguments(commandName);
                        setActiveBot(false);
                      }}
                      className="w-[28vw] h-10 p-2 text-lg rounded-full transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-green-600 shadow-lg shadow-green-700 back text-zinc-100"
                    >
                      {commandName}
                    </h1>
                    <div className="h-2 flex flex-col mx-1">
                      <h3
                        onClick={() => getCommandInfo(commandName)}
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
    </main>
  );
}