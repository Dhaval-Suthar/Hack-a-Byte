"use client";
import { useState } from "react";
import {
  handleAccess,
  handleBalance,
  handleDelete,
  handleHelp,
  handleLogIn,
  handleSignUp,
  handleTransfer,
} from "./lib/commands";

export default function Page() {
  const diractory = "@HackBook-L ~ % "; // Present Working Diractory

  const DEFAULT_USER = "0.0.0.0"; // Username of the loggged in User

  const [command, setCommand] = useState(""); // User Command
  const [activeUser, setActiveUser] = useState(DEFAULT_USER); // Username of the loggged in User
  const [activeDiractory, setActiveDiractory] = useState(diractory); // Directory of the loggged in User
  const [userId, setUserId] = useState("0"); // Username of the loggged in User

  async function handleCommand() {
    let commands = command.split(" "); // Separate commands and arguments from command

    const operation = commands[0]; // get operation to perform

    let output = document.createElement("li"); // Create a li element

    let user = activeUser; // User

    switch (operation) {
      case "help":
        let helpResult = handleHelp(); // Run the operation
        output.innerHTML = helpResult.output; // Display the output in the terminal
        break;

      case "signup":
        let signUpResult = await handleSignUp(commands[1], commands[2]); // Run the operation
        output.innerHTML = signUpResult.output; // Display the output in the terminal
        if (signUpResult.acknowledged) {
          // Set user
          setActiveUser(commands[1]);
          user = commands[1];
          setUserId(signUpResult.id); // Set id
        } // If the operation is successfull
        break;

      case "login":
        let logInResult = await handleLogIn(commands[1], commands[2]); // Run the operation
        output.innerHTML = logInResult.output; // Display the output in the terminal
        // If the operation is successfull
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
        let deleteResult = await handleDelete(commands[1], commands[2]); // Run the operation
        output.innerHTML = deleteResult.output; // Display the output in the terminal

        // If the operation is successfull and the deleted user is logged in
        if (deleteResult.acknowledged && activeUser === commands[1]) {
          // Set user to default
          setActiveUser(DEFAULT_USER);
          user = DEFAULT_USER;
          setUserId("0"); // Set id to default
        }
        break;

      case "access":
        let accessResult = await handleAccess(); // Run the operation
        output.innerHTML = accessResult.output; // Display the output in the terminal
        break;

      case "balance":
        let balanceResult = await handleBalance(userId); // Run the operation
        output.innerHTML = balanceResult.output; // Display the output in the terminal
        break;

      case "transfer":
        let transferResult = await handleTransfer(
          userId,
          commands[1],
          commands[2]
        ); // Run the operation
        output.innerHTML = transferResult.output; // Display the output in the terminal
        break;

      default:
        output.innerHTML = `<h3>command not found: ${operation} </h3>`; // Default message to unknown operations
        break;
    }

    // Print command
    let commandElement = document.createElement("li"); // Creating li element
    commandElement.innerHTML = `<h3>${
      activeUser + activeDiractory + command
    }</h3>`;

    setCommand(""); // Empty Command

    // Print output
    let consoleElement = document.getElementById("consoleElement");
    consoleElement?.appendChild(commandElement);
    consoleElement?.appendChild(output);

    // Print commandPrompt
    let commandPrompt = document.getElementById("command-prompt"); // Getting the command prompt element
    commandPrompt && consoleElement?.appendChild(commandPrompt);

    let commandLine = document.getElementById("command-line");
    commandLine?.focus(); // Focus the commandLine
  }

  return (
    <main className="min-h-screen min-w-full bg-zinc-900 text-white">
      <div>
        <ul id="consoleElement">
          <h3> - type help - </h3>
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
                  if (e.key === "Enter") {
                    // If enter key is pressed
                    handleCommand(); // Handle the command
                  }
                }}
              />
              <h3 className="absolute bg-transparent text-transparent select-none">
                {activeUser + activeDiractory}
              </h3>
            </div>
          </li>
        </ul>
      </div>
    </main>
  );
}
