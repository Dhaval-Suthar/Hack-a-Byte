"use client";
import { useState } from "react";
import {
  handleSearch,
  handleAdmin,
  handleBalance,
  handleStorage,
  handleDelete,
  handleHelp,
  handleLogIn,
  handleSignUp,
  handleTransfer,
  handleBrowser,
  handleBrowse,
  handleHam,
  handleLeaderboard,
  handleTransactions,
  handleClear,
  handleDeploy,
} from "./lib/commands";

// Default Values
const DEFAULT_USERNAME = "0.0.0.0";
const DEFAULT_USER_ID = "0";
const DEFAULT_COMPUTER_MODEL = "HackBook-L";
const ROOT_DIRECTORY = "~";

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
    let consoleElement = document.getElementById("console-element"); // Getting the console element

    // Print command
    let commandElement = document.createElement("li"); // Creating li element
    commandElement.innerHTML = prompt + command; // Setting the innerHTML of li element to the command
    consoleElement?.appendChild(commandElement); // Appending to consoleElement
  }

  async function executeCommand(password = "") {
    const commands = command.split(" "); // Separate commands and arguments from command
    const operation = commands[0]; // get operation to perform

    let output = document.createElement("li"); // Create a li element
    let loading = document.createElement("li"); // Create a li element
    loading.innerHTML = "null";

    let user = username; // User

    const consoleElement = document.getElementById("console-element"); // Getting the console element
    const commandPrompt = document.getElementById("command-prompt"); // Getting the command prompt element
    commandPrompt && consoleElement?.removeChild(commandPrompt);

    switch (operation) {
      case "help":
        output.innerHTML = handleHelp(commands[1]).output; // Display the output in the terminal
        output.style.color = "#c3bcbc";
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
          setUsername(commands[1]);
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
          setUsername(commands[1]);
          user = commands[1];
          setUserId(logInResult.id); // Set id
        }
        break;

      case "logout":
        if (user === DEFAULT_USERNAME) {
          output.innerHTML = `<h3>Already Logged Out</h3>`; // Display the output in the terminal
        } else {
          output.innerHTML = `<h3>Logged Out Successfully!</h3>`; // Display the output in the terminal
          setUsername(DEFAULT_USERNAME); // Set user to default
          user = DEFAULT_USERNAME;
          setUserId("0"); // Set id to default
        }
        break;

      case "delete":
        // Start loading
        loading.innerHTML = `<h3>Checking Authentication... </h3>`;
        consoleElement?.appendChild(loading);

        const deleteResult = await handleDelete(commands[1], password); // Run the operation
        output.innerHTML = deleteResult.output; // Display the output in the terminal

        if (deleteResult.acknowledged && username === commands[1]) {
          // If the operation is successful and the deleted user is logged in
          setUsername(DEFAULT_USERNAME); // Set user to default
          user = DEFAULT_USERNAME;
          setUserId("0"); // Set id to default
        }
        break;

      case "search":
        // Start loading
        loading.innerHTML = `<h3>Fetching... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleSearch()).output; // Display the output in the terminal
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

        output.innerHTML = (await handleLeaderboard()).output; // Display the output in the terminal
        break;

      case "transactions":
        // Start loading
        loading.innerHTML = `<h3>Fetching... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleTransactions(user)).output; // Display the output in the terminal
        break;

      case "browser":
        switch (commands[1]) {
          case "hack":
            loading.innerHTML = `<h3>Hacking... </h3>`;
            break;
          default:
            loading.innerHTML = `<h3>Processing... </h3>`;
            break;
        }

        consoleElement?.appendChild(loading); // Start loading

        output.innerHTML = (await handleBrowser(user, commands[1], commands[2] ?? "none")).output; // Display the output in the terminal
        break;

      case "browse":
        // Start loading
        loading.innerHTML = `<h3>Browsing... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleBrowse()).output; // Display the output in the terminal
        break;

      case "clear":
        handleClear();
        break;

      case "ham":
        if (commands[1] !== "install") {
          output.innerHTML = `<h3>Usage: ham install [software's name]</h3>`;
          break;
        }

        // Start loading
        loading.innerHTML = `<h3>Installing... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleHam(user, commands[2])).output; // Display the output in the terminal
        break;

      case "deploy":
        // Start loading
        loading.innerHTML = `<h3>Deploying... </h3>`;
        consoleElement?.appendChild(loading);

        output.innerHTML = (await handleDeploy(user, commands[2] ?? "", commands[1] ?? "")).output; // Display the output in the terminal
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

  function askForPassword() {
    const output = document.createElement("li"); // Create a li element
    const consoleElement = document.getElementById("console-element"); // Getting the console element
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

        executeCommand(input.value); // Handle the command
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

  function askConfirmation() {
    const output = document.createElement("li"); // Create a li element
    const info = document.createElement("li"); // Create a li element
    const consoleElement = document.getElementById("console-element"); // Getting the console element
    const commandPrompt = document.getElementById("command-prompt"); // Getting the command prompt element
    const commands = command.split(" "); // Separate commands and arguments from command

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

        consoleElement?.removeChild(info); // Remove info

        switch (input.value) {
          case "yes":
            commandPrompt && consoleElement?.appendChild(commandPrompt); // Print commandPrompt
            consoleElement?.removeChild(output); // Remove output
            executeCommand(); // Handle the command
            break;

          case "no":
            output.innerHTML = `<h3 class="flex text-red-800">Operation Cancelled</h3>`; // Display the output in the terminal
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

    if (commands[0] === "ham") {
      switch (commands[2]) {
        case "virus":
          info.innerHTML = `<h3>That will be 1000 rupee</h3>`; // Display the output in the terminal
          consoleElement?.appendChild(info);
          break;
        default:
          setCommand(""); // Empty Command
          output.innerHTML = `<h3>Software does not exists.</h3>`; // Display the output in the terminal
          consoleElement?.appendChild(output);
          commandPrompt && consoleElement?.appendChild(commandPrompt); // Print commandPrompt
          focusCommandLine();
          return;
      }
    }

    output.innerHTML = `<h3 class="flex">Are You Sure? (yes/no) : </h3>`; // Display the output in the terminal

    // Print output
    output.appendChild(input);
    consoleElement?.appendChild(output);

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
                  // make argumentSuggestion empty
                  if (argumentSuggestion !== "") {
                    setArgumentSuggestion("");
                  }

                  // Suggest it's arguments
                  if (COMMANDS[commandToPerform as keyof typeof COMMANDS] && e.key === " ") {
                    suggestArguments(command);
                  }

                  // If enter key is pressed
                  if (e.key === "Enter") {
                    printCommand();

                    if (COMMANDS[commandToPerform as keyof typeof COMMANDS]?.requiresPassword && argumentList.length) {
                      askForPassword();
                    } else if (
                      COMMANDS[commandToPerform as keyof typeof COMMANDS]?.requiresConfirmation &&
                      argumentList.length
                    ) {
                      askConfirmation();
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

class Command {
  description: string;
  argumentsRequired: string;
  requiresPassword: boolean;
  requiresConfirmation: boolean;
  hidden: boolean;

  constructor({
    description = "",
    argumentsRequired = "",
    requiresPassword = false,
    requiresConfirmation = false,
    hidden = false,
  }) {
    this.description = description;
    this.argumentsRequired = argumentsRequired;
    this.requiresPassword = requiresPassword;
    this.requiresConfirmation = requiresConfirmation;
    this.hidden = hidden;
  }
}

// List of commands
const COMMANDS = {
  login: new Command({
    description: "Logs you into your existing account",
    argumentsRequired: "[username]",
    requiresPassword: true,
  }),
  logout: new Command({ description: "Logs you out of your account" }),
  search: new Command({ description: "Gives a random account you could try to hack" }),
  admin: new Command({ description: "Secret command to do admin tasks", argumentsRequired: "[username] [secret code]", requiresPassword: true, hidden: true }),
  balance: new Command({ description: "Gets your account balance" }),
  storage: new Command({ description: "Gets your computer storage" }),
  delete: new Command({
    description: "Permanently deletes your account",
    argumentsRequired: "[username]",
    requiresPassword: true,
  }),
  help: new Command({ description: "Shows description of the command you pass as argument", argumentsRequired: "[command]" }),
  signup: new Command({
    description: "Creates a new account",
    argumentsRequired: "[username]",
    requiresPassword: true,
  }),
  transfer: new Command({
    description: "Transfer money from one user to another",
    argumentsRequired: "[receiver] [amount]",
    requiresPassword: true,
    requiresConfirmation: true,
  }),
  browser: new Command({
    description: "Used to hack websites and to install malwares on websites",
    argumentsRequired: "hack [website link]",
  }),
  browse: new Command({ description: "Gives random 10 website links" }),
  ham: new Command({
    description: "ham is a package manager which let you install various softwares and malwares",
    argumentsRequired: "install [software id]",
    requiresConfirmation: true,
  }),
  leaderboard: new Command({ description: "Gives a list of top 10 hackers all over the world" }),
  transactions: new Command({ description: "Shows your transaction history" }),
  clear: new Command({ description: "Clears terminal history" }),
  deploy: new Command({ description: "Used to deploy a malware on a website you own", argumentsRequired: "[software id] [your website link]" }),
};
