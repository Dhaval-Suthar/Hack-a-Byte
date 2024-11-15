import Link from "next/link";

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

  // Command Information
  const [prevCommands, setPrevCommands] = useState<string[]>([]) // stores prev commands
  const [index, setIndex] = useState(0) // stores prev commands
  const [backupCommand, setBackupCommand] = useState('');
  const [argumentSuggestion, setArgumentSuggestion] = useState("");
  let password = DEFAULT_PASSWORD;

  //Game Information
  const [topPlayers, setTopPlayers] = useState([{ username: "loading", balance: 0 }]);
  

  // quickfix for scrollbug
  useEffect(() => { 

    const commandPrompt = document.getElementById('commandList');
    function onScroll(e: WheelEvent) { 
   
      e.preventDefault();
      if (commandPrompt) { 
        commandPrompt.scrollTop += -e.deltaY;

      }
    
    }

    commandPrompt?.addEventListener('wheel', onScroll)
    return () => commandPrompt?.removeEventListener('wheel', onScroll)
  }, [])

  // Functions
  function focusCommandLine() {
    const commandLine = document.getElementById("command-line");
    commandLine?.focus();
  }

  // Fucntions
  async function fetchLeaderboard() {
    const response = await leaderboard();

    if (response.data) {
      const playerList = JSON.parse(response.data);
      setTopPlayers(playerList);
    }
  }

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
      setPrevCommands(prevcmds => [ command,...prevcmds]);
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

  function getCommandInfo(commandName: string) {
    setCommand("help " + commandName);
    setActiveBot(false);
    focusCommandLine();
  }

  useEffect(() => {
    if(localStorage.getItem('userId')) {
      setComputerModel("hackbook-W95");
    }
    
    fetchLeaderboard();
    setInterval(() => {
      fetchLeaderboard();
    }, 10000);
  }, []);

  return (
    <div className="flex flex-col justify-center w-screen h-screen">
      <div className="m-auto">
        <h1 className="text-white text-center">Welcome to hack-a-byte</h1>
        <Link href="/login" className="text-blue-400">join</Link>
      </div>
    </div>
  );
}
