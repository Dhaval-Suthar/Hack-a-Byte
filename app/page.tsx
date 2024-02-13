"use client";
import { useState } from "react";
import {
  handleAccess,
  handleAdmin,
  handleBalance,
  handleStorage,
  handleDelete,
  handleHelp,
  handleLogIn,
  handleSignUp,
  handleTransfer,
  handleleaderboard,
  handletransactions,
  handleClear,
} from "./lib/commands";

export default function Page() {
  const diractory = "@HackBook-L ~ % "; // Present Working Diractory

  const DEFAULT_USER = "0.0.0.0"; // Username of the loggged in User

  const [command, setCommand] = useState(""); // User Command
  const [activeUser, setActiveUser] = useState(DEFAULT_USER); // Username of the loggged in User
  const [activeDiractory, setActiveDiractory] = useState(diractory); // Directory of the loggged in User
  const [userId, setUserId] = useState("0"); // Username of the loggged in User

    const [assist, setAssist] = useState(false);
    const [required, setRequired] = useState("");

    function focusCommandLine() {
      const commandLine = document.getElementById("command-line");
      commandLine?.focus(); // Focus the commandLine
    }

  function printCommand() {
    let consoleElement = document.getElementById("consoleElement"); // Getting the console element

    // Print command
    let commandElement = document.createElement("li"); // Creating li element
    commandElement.innerHTML = `<h3>${activeUser + activeDiractory + command}</h3>`; // Setting the innerHTML of li element to the command
    consoleElement?.appendChild(commandElement); // Appending to consoleElement
  }

  async function handleCommand(password = "") {
    const commands = command.split(" "); // Separate commands and arguments from command
    const operation = commands[0]; // get operation to perform

    let output = document.createElement("li"); // Create a li element
    let loading = document.createElement("li"); // Create a li element
    loading.innerHTML = "null";

    let user = activeUser; // User

    const consoleElement = document.getElementById("consoleElement"); // Getting the console element
    const commandPrompt = document.getElementById("command-prompt"); // Getting the command prompt element
    commandPrompt && consoleElement?.removeChild(commandPrompt);

    switch (operation) {
      case "help":
        output.innerHTML = handleHelp().output; // Display the output in the terminal
        break;

      case "admin":
        output.innerHTML = (await handleAdmin(commands[1], commands[2], password)).output; // Display the output in the terminal
        break;

      case "signup":
        // Start loading
        loading.innerHTML = `<h3>SigningUp... </h3>`;
        consoleElement?.appendChild(loading);

        const signUpResult = await handleSignUp(commands[1], password); // Run the operation
        output.innerHTML = signUpResult.output; // Display the output in the terminal

        if (signUpResult.acknowledged) {
          // Set user
          setActiveUser(commands[1]);
          user = commands[1];
          setUserId(signUpResult.id); // Set id
        }
        break;

      case "login":
        // Start loading
        loading.innerHTML = `<h3>Checking Credentials... </h3>`;
        consoleElement?.appendChild(loading);

        const logInResult = await handleLogIn(commands[1], password); // Run the operation
        output.innerHTML = logInResult.output; // Display the output in the terminal

        if (logInResult.acknowledged) {
          // Set user
          setActiveUser(commands[1]);
          user = commands[1];
          setUserId(logInResult.id); // Set id
        }
        break;

      case "logout":
        if (user === DEFAULT_USER) {
          output.innerHTML = `<h3>Already Logged Out</h3>`; // Display the output in the terminal
        } else {
          output.innerHTML = `<h3>Logged Out Successfully!</h3>`; // Display the output in the terminal
          setActiveUser(DEFAULT_USER); // Set user to default
          user = DEFAULT_USER;
          setUserId("0"); // Set id to default
        }
        break;

      case "delete":
        // Start loading
        loading.innerHTML = `<h3>Checking Authentication... </h3>`;
        consoleElement?.appendChild(loading);

        const deleteResult = await handleDelete(commands[1], password); // Run the operation
        output.innerHTML = deleteResult.output; // Display the output in the terminal

        if (deleteResult.acknowledged && activeUser === commands[1]) {
          // If the operation is successful and the deleted user is logged in
          setActiveUser(DEFAULT_USER); // Set user to default
          user = DEFAULT_USER;
          setUserId("0"); // Set id to default
        }
        break;

      case "access":
        // Start loading
        loading.innerHTML = `<h3>Fetching... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleAccess()).output; // Display the output in the terminal
        break;

      case "balance":
        // Start loading
        loading.innerHTML = `<h3>Fetching... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleBalance(userId)).output; // Display the output in the terminal
        break;

      case "storage":
        // Start loading
        loading.innerHTML = `<h3>Fetching... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleStorage(userId)).output; // Display the output in the terminal
        break;

      case "transfer":
        // Start loading
        loading.innerHTML = `<h3>Transfering... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleTransfer(user, commands[1], commands[2])).output; // Display the output in the terminal
        break;

      case "leaderboard":
        // Start loading
        loading.innerHTML = `<h3>Fetching... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleleaderboard()).output; // Display the output in the terminal
        break;

      case "transactions":
        // Start loading
        loading.innerHTML = `<h3>Fetching... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handletransactions(user)).output; // Display the output in the terminal
        break;
      case "clear":
        handleClear(consoleElement)
        break; 
      default:
        output.innerHTML = `<h3>command not found: ${operation} </h3>`; // Default message for unknown operations
        break;
    }

    if (loading.innerHTML !== "null") {
      // End loading
      consoleElement?.removeChild(loading);
    }

    setCommand(""); // Empty Command

    // Print output
    consoleElement?.appendChild(output);

    // Print commandPrompt
    commandPrompt && consoleElement?.appendChild(commandPrompt);

    focusCommandLine();
  }

  function handlePassword() {
    const output = document.createElement("li"); // Create a li element
    const consoleElement = document.getElementById("consoleElement"); // Getting the console element
    const commandPrompt = document.getElementById("command-prompt"); // Getting the command prompt element

    if (commandPrompt) {
      consoleElement?.removeChild(commandPrompt); // Remove commandPrompt
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

        consoleElement?.removeChild(output); // Remove output

        if (commandPrompt) {
          consoleElement?.appendChild(commandPrompt); // Print commandPrompt
        }

        handleCommand(input.value); // Handle the command
      }
    };

    // Properties of output
    output.style.display = "flex";
    output.innerHTML = `
      <h3 class="flex">Password:
        <div class="w-4 h-5 rounded-md bg-gray-400 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 -rotate-45 m-auto text-black">
            <path fill-rule="evenodd" d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 0 0-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5A.75.75 0 0 0 9 19.5V18h1.5a.75.75 0 0 0 .53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z" clip-rule="evenodd" />
          </svg>
        </div>
      </h3>`;

    // Print output
    output.appendChild(input);
    consoleElement?.appendChild(output);

    // Focus input for every key down
    window.addEventListener("keydown", focusInput);
    window.addEventListener("click", focusInput);
  }

  function handleConfirmation() {
    const output = document.createElement("li"); // Create a li element
    const consoleElement = document.getElementById("consoleElement"); // Getting the console element
    const commandPrompt = document.getElementById("command-prompt"); // Getting the command prompt element

    commandPrompt && consoleElement?.removeChild(commandPrompt); // Remove commandPrompt

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

        switch (input.value) {
          case "yes":
            commandPrompt && consoleElement?.appendChild(commandPrompt); // Print commandPrompt
            consoleElement?.removeChild(output); // Remove output
            handleCommand(); // Handle the command
            break;

          case "no":
            output.innerHTML = `<h3 class="flex text-red-800">Transfer Cancelled</h3>`; // Display the output in the terminal
            consoleElement?.appendChild(output);
            setCommand(""); // Empty Command
            commandPrompt && consoleElement?.appendChild(commandPrompt); // Print commandPrompt
            break;

          default:
            output.innerHTML = `<h3 class="flex text-red-800">Invalid Input</h3>`; // Display the output in the terminal
            consoleElement?.appendChild(output);
            setCommand(""); // Empty Command
            commandPrompt && consoleElement?.appendChild(commandPrompt); // Print commandPrompt
            break;
        }
      }
    };

    // Properties of output
    output.style.display = "flex";
    output.innerHTML = `<h3 class="flex">Are You Sure? (yes/no) : `;

    // Print output
    output.appendChild(input);
    consoleElement?.appendChild(output);

    // Focus input for every key down
    window.addEventListener("keydown", focusInput);
    window.addEventListener("click", focusInput);
  }

  const commands = [
    "login",
    "signup",
    "delete",
    "transfer",
    "leaderboard",
    "logout",
    "access",
    "balance",
    "help",
  ];

  const suggest = (inputCommand: string, addSpace: boolean = true) => {
    if (["login", "delete", "signup"].includes(inputCommand)) {
      setRequired(`username`);
      if (addSpace) inputCommand = inputCommand + " ";
    } else {
      setRequired("");
    }

    switch (inputCommand) {
      case "transfer":
        setRequired("receiver amount");
        if (addSpace) inputCommand = inputCommand + " ";
        break;
      case "help":
        setRequired("command");
        if (addSpace) inputCommand = inputCommand + " ";
        break;
      default:
        break;
    }

    setCommand(inputCommand);
    focusCommandLine();
  };

  const help = (inputCommand: string) => {
    setCommand("help " + inputCommand);
    focusCommandLine();
  };

  return (
    <main className="min-h-screen min-w-full bg-zinc-900 text-white">
      <div>
        <ul id="consoleElement">
          <li id="command-prompt">
            <div>
              <textarea
                className="bg-zinc-900 outline-none w-full absolute h-full"
                value={activeUser + activeDiractory + command}
                id="command-line"
                onChange={(e) => {
                  if (e.target.value[e.target.value.length - 1] !== "\n") {
                    setCommand(
                      e.target.value.slice(
                        (activeUser + activeDiractory).length
                      )
                    );
                  }
                }}
                onKeyDown={(e) => {
                  // If user changes the value of the command and required is not empty
                  if (required !== "") {
                    setRequired("");
                  }

                  // if the user types a command suggest its completion
                  if (commands.includes(command) && e.key === " ") {
                    suggest(command, false);
                  }

                  // If enter key is pressed
                  if (e.key === "Enter") {
                    printCommand();

                    let commands = command.split(" "); // Separate commands and arguments from command
                    let operation = commands[0]; // get operation to perform

                    // If commands requires password
                    if (
                      ["login", "signup", "delete", "admin"].includes(
                        operation
                      ) &&
                      commands[1]
                    ) {
                      handlePassword(); // Ask for password
                    } else if (operation === "transfer") {
                      handleConfirmation(); // Handle confirmation
                    } else {
                      handleCommand(); // Handle the command
                    }
                  }
                }}
              />
              <div className="absolute text-zinc-400 flex ml-1">
                <h3 className="text-transparent">
                  {activeUser + activeDiractory + command}
                </h3>
                <h3>{required}</h3>
              </div>
              <h3 className="absolute bg-transparent text-transparent select-none">
                {activeUser + activeDiractory}
              </h3>
            </div>
          </li>
        </ul>
        <div className="h-20 w-20 fixed right-0 bottom-0 m-10 z-20 ">
          <button onClick={() => setAssist(!assist)}>
            <img src="./image.png" alt="assitant" className="absolute z-10" />
          </button>
          <div className="absolute h-20 w-20">
            <div
              className={`absolute h-16 ${
                assist && "rotate-180"
              } w-60 duration-1000 transition-all right-0 mr-1 origin-top text-black bg-transparent`}
            >
              {commands
                .filter((inputCommand) => inputCommand !== "help")
                .map((inputCommand) => (
                  <div
                    key={inputCommand}
                    className={`${
                      !assist && "scale-0"
                    } text-center rotate-180 flex justify-center my-8 text-2xl transition-all duration-1000`}
                  >
                    <h1
                      onClick={() => suggest(inputCommand)}
                      className="w-32 h-10 p-1 text-xl rounded-full transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-green-600 shadow-lg shadow-green-700 back text-zinc-100"
                    >
                      {inputCommand}
                    </h1>
                    <div className="h-2 flex flex-col mx-1">
                      <h3
                        onClick={() => help(inputCommand)}
                        className="w-5 h-5 m-3 bg-blue-800 rounded-full text-sm text-white shadow-sm shadow-zinc-700 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                      >
                        i
                      </h3>
                    </div>
                  </div>
                ))}
            </div>
            {/* <div
              className={`absolute h-16 ${
                help ? "w-80" : "w-16"
              } duration-500 transition-all right-0 mr-1 text-black bg-white rounded-full `}
            >
              <div
                className={`${
                  !help && "hidden"
                } text-center flex justify-start my-4 text-2xl transition-all duration-1000`}
              >
                <div className="h-2 flex flex-col mx-8">
                  <h3 className="w-5 h-5">^</h3>
                  <h3 className="rotate-180 w-5 h-5">^</h3>
                </div>
                <h1 className="w-32 h-10 p-1 rounded-full bg-green-600 shadow-lg shadow-green-700 back text-zinc-100">Signup</h1>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </main>
  );
}
