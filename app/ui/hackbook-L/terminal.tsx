"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playTypingSound, playCommandSound } from "@/app/lib/sounds";
import { execute } from "@/app/lib/actions";
import { DefaultValues, Models } from "@/app/lib/constants";
import { ProcessState } from "@/app/lib/definitions";
import { useRouter } from "next/navigation";

export default function GamingTerminal() {
  const router = useRouter();

  // Shutdown related
  const [shuttingDown, setShuttingDown] = useState(false);

  // History
  const [commandHistory] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [inputCommand, setInputCommand] = useState("");

  // Misc
  const [processState, setProcessState] = useState(new ProcessState({}));
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [amount, setAmount] = useState(0);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [output]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!processState.requires) {
      if (input.trim() === "") return;

      // Update the value of command in commandHistory
      commandHistory.push(input);
      setIndex(commandHistory.length);
    }

    if (typeof window !== "undefined" && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)) {
      playCommandSound();
    }

    const commandOuput = await processCommand(input);

    if (!commandOuput) {
      setInput("");
      return;
    }

    let newOutput = [...output, `> ${input ? input : processState.command.split(" % ")[1]}`];

    commandOuput.split("\n").forEach((line) => {
      newOutput = [...newOutput, line];
    });

    setOutput(newOutput);

    setInput("");

    setTimeout(() => {
      if (linesRef.current) {
        linesRef.current.scrollTop = linesRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window !== "undefined" && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)) {
      playTypingSound();
    }
    setInput(e.target.value);
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();

      if (index === commandHistory.length) {
        setInputCommand(input);
      }

      if (index > 0) {
        setIndex(index - 1);
        setInput(commandHistory[index - 1]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();

      if (index === commandHistory.length - 1) {
        setIndex(index + 1);
        setInput(inputCommand);
      }

      if (index < commandHistory.length - 1) {
        setIndex(index + 1);
        setInput(commandHistory[index + 1]);
      }
    } else if (e.key === "Tab") {
      // inputElement.value = prompt + commandHistory[index]; TODO: Implement tab completion
    }
  }

  const processCommand = async (cmd: string): Promise<string> => {
    const prompt = `${localStorage.getItem("user-" + Models.L)}@${Models.L} ${DefaultValues.ROOT_DIRECTORY} % `;

    const formData = new FormData();
    if (processState.requires) {
      switch (processState.requires) {
        case "amount":
          formData.append("amount", amount.toString());
          setAmount(0);
          break;
        case "confirmation":
          formData.append("confirmation", confirmation ? confirmation : "n");
          setConfirmation("");
          break;
        default:
          if (processState.requires.includes("password")) {
            formData.append("password", password);
            setPassword("");
          }
      }
    } else {
      formData.append("command", prompt + cmd);
    }

    const response = await execute(new ProcessState(processState).toPlainObject() as ProcessState, formData);
    setProcessState(response);

    if (response.clear) {
      setOutput([]);
    }

    if (response.shutdown) {
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

      setShuttingDown(true);
    }

    if (response.error) return response.error;

    if (response.requires) return "";

    return response.message;
  };

  return (
    <div className="min-h-screen bg-black p-4 font-mono text-green-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto h-full rounded-lg bg-gray-900 p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex space-x-2"></div>
          <div className="text-sm font-bold">Hackbook-L v1.0</div>
        </div>
        <div className="flex space-x-4">
          <div className="flex-grow h-[85vh]">
            <div ref={linesRef} className="h-[75vh] overflow-y-auto pr-4 mb-4 hide-scrollbar">
              <AnimatePresence>
                {output.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: (index % 10) * 0.05 }}
                    className="mb-2"
                  >
                    {line}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <form onSubmit={handleSubmit} className="mb-4 flex items-center">
              {!processState.requires && (
                <>
                  <span className="mr-2">{">"}</span>
                  <input
                    ref={inputRef}
                    type="text"
                    name="command"
                    id="command-line"
                    value={input}
                    disabled={shuttingDown}
                    autoComplete="off"
                    spellCheck="false"
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="flex-grow bg-transparent focus:outline-none"
                    placeholder="Type a command..."
                  />
                </>
              )}

              {processState.requires === "amount" && (
                <>
                  <span className="mr-2">{"₹"}</span>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    value={amount}
                    autoComplete="off"
                    autoFocus
                    onChange={(e) => setAmount(parseInt(e.target.value))}
                    className="flex-grow bg-transparent focus:outline-none"
                    placeholder="0"
                  />
                </>
              )}

              {processState.requires === "confirmation" && (
                <>
                  <span className="mr-2">{`${processState.message}: `}</span>
                  <input
                    type="text"
                    name="confirmation"
                    id="confirmation"
                    autoComplete="off"
                    autoFocus
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="flex-grow bg-transparent focus:outline-none"
                    placeholder="y/n"
                  />
                </>
              )}

              {processState.requires.includes("password") && (
                <>
                  <span className="mr-2">{`${processState.requires}:`}</span>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={password}
                    autoFocus
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-grow bg-transparent focus:outline-none"
                    placeholder="****"
                  />
                </>
              )}
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
