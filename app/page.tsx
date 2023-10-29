"use client";
import { deleteUser, login, signup } from "@/app/lib/actions";
import { useState } from "react";
import { handleDelete, handleLogIn, handleSignUp } from "./lib/commands";

export default function Page() {
  const diractory = "@HackBook-L ~ % "; // Present Working Diractory

  let activeUser = "0.0.0.0"; // Username of the loggged in User

  const [command, setCommand] = useState(""); // User Command

  async function handleCommand(e: any) {
    e.preventDefault(); // Avoid reload

    let commands = command.split(" "); // Separate commands and arguments from command

    const operation = commands[0]; // get operation to perform

    let output = document.createElement("li"); // Create a li element

    switch (operation) {
      case "signup":
        let signUpResult = await handleSignUp(commands[1], commands[2]); // Run the operation
        output.innerHTML = signUpResult.output; // Display the output in the terminal
        if (signUpResult.acknowledged) activeUser = commands[1]; // If the operation is successfull
        break;

      case "login":
        let logInResult = await handleLogIn(commands[1], commands[2]); // Run the operation
        output.innerHTML = logInResult.output; // Display the output in the terminal
        if (logInResult.acknowledged) activeUser = commands[1]; // If the operation is successfull
        break;

      case "logout":
        output.innerHTML = `<h3 class="text-red-800">Logged Out Successfully!</h3>`; // Display the output in the terminal
        activeUser = "0.0.0.0";  // Set user to default user
        break;

      case "delete":
        let deleteResult = await handleDelete(commands[1], commands[2]); // Run the operation
        output.innerHTML = deleteResult.output; // Display the output in the terminal

        // If the operation is successfull and the deleted user is logged in
        if (deleteResult.acknowledged && activeUser === commands[1]) {
          activeUser = "0.0.0.0";
        }
        break;

      default:
        output.innerHTML = `<h3>command not found: ${operation} </h3>`; // Default message to unknown operations
        break;
    }

    let commandElement = document.createElement("text"); // Creating text element
    commandElement.innerHTML = command; // Set the value as the command given

    let commandPrompt = document.getElementById("command-prompt"); // Getting the command prompt element
    commandPrompt?.parentNode?.appendChild(commandElement); // Appending commandElement to commandPrompt

    let consoleElement = document.getElementById("consoleElement"); // Get the consoleElement element
    consoleElement?.appendChild(output); // Append output

    let commandLine = document.createElement("h3"); // Create a h3 element
    commandLine.innerHTML = activeUser + diractory; // Copy the active user and the diractory to commandLine
    commandPrompt && commandLine.appendChild(commandPrompt); // If commandPrompt is not null then append commandPrompt

    let ListElement = document.createElement("li"); // Create a li element
    ListElement.appendChild(commandLine); // Append commandLine to ListElement
    consoleElement?.appendChild(ListElement); // Append ListElement to consoleElement
    commandPrompt?.focus(); // Focus the commandPrompt

    setCommand(""); // Empty Command
  }

  return (
    <main className="min-h-screen min-w-full bg-zinc-900 text-white">
      <form onSubmit={handleCommand}>
        <ul id="consoleElement">
          <li>
            <h3>Last login: Fri Oct 13 18:22:24 on console</h3>
          </li>
          <li>
            <h3>
              {activeUser + diractory}
              <input
                className="bg-transparent outline-none w-[80vw]"
                type="text"
                name="command-prompt"
                id="command-prompt"
                value={command}
                onChange={(e) => {
                  setCommand(e.target.value);
                }}
              />
            </h3>
          </li>
        </ul>
      </form>
    </main>
  );
}
