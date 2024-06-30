import { State, Command } from "@/app/lib/definitions";
import { action, logout } from "./actions";
import { redirect } from "next/navigation";

export async function execute(prompt: string, device: string, prevState: State, formData: FormData) {
  // Get the command and arguments from the form data
  const commandWithPrompt = (formData.get("command") as string) || prevState.command || "";
  const password = formData.get("password") as string;
  const amount = formData.get("amount") as string;
  const confirmation = formData.get("confirmation") as string;

  // Variables
  const commands = commandWithPrompt.slice(prompt.length);
  const command = commands.split(" ")[0];
  const argumentsPassed = commands.slice(command.length + 1).split(" ");
  const argumentCount = commands.split(" ").length - 1;
  let data: any = {};

  // Check for invalid command or arguments
  if (!COMMANDS[command as keyof typeof COMMANDS]) {
    return {
      error: `<h3>command not found: ${command}</h3>`,
      command: commandWithPrompt,
    };
  }

  if (
    argumentCount <
    COMMANDS[command as keyof typeof COMMANDS].usage.split(" ").length -
      1 -
      COMMANDS[command as keyof typeof COMMANDS].optionalArguments
  ) {
    return {
      error: `<h3>Usage: ${COMMANDS[command as keyof typeof COMMANDS].usage}</h3>`,
      command: commandWithPrompt,
    };
  }

  if (password !== null) {
    if (!Number(password))
      return { error: `<h3 class="text-red-800">password should be only numbers</h3>`, command: commandWithPrompt };

    if (password.length !== 4)
      return {
        error: `<h3 class="text-red-800">password should have 4 digits</h3>`,
        command: commandWithPrompt,
      };

    data.password = password;
  }

  if (amount !== null) {
    if (amount === "0")
      return { error: `<h3 class="text-red-800">amount should be greater than 0</h3>`, command: commandWithPrompt };

    if (!Number(amount))
      return { error: `<h3 class="text-red-800">amount should be only numbers</h3>`, command: commandWithPrompt };

    if (Number(amount) < 1)
      return {
        error: `<h3 class="text-red-800">amount should be greater than 0 </h3>`,
        command: commandWithPrompt,
      };

    data.amount = Number(amount);
  }

  // Assign the arguments passed to the data object
  COMMANDS[command as keyof typeof COMMANDS].usage
    .slice(command.length + 1)
    .replaceAll("[", "")
    .replaceAll("]", "")
    .split(" ")
    .map((arg, index) => {
      data[arg] = argumentsPassed[index];
    });

  // Check for confirmation
  switch (COMMANDS[command as keyof typeof COMMANDS].confirm) {
    case "password":
      if (!password) {
        return {
          require: "password",
          command: commandWithPrompt,
        };
      }

      if (!prevState.password) {
        return {
          require: "confirm password",
          password: password,
          command: commandWithPrompt,
        };
      }

      if (prevState.password !== password) {
        return {
          error: `<h3 class="text-red-800">passwords do not match</h3>`,
          command: commandWithPrompt,
        };
      }

      break;

    case "none":
      break;

    default:
      if (confirmation === null) {
        return {
          confirm:
            COMMANDS[command as keyof typeof COMMANDS].confirm === "install"
              ? data.software
              : COMMANDS[command as keyof typeof COMMANDS].confirm,
          command: commandWithPrompt,
        };
      }
      break;
  }

  if (prevState.confirm && confirmation !== null) {
    switch (confirmation) {
      case "y":
        data.confirm = true;
        break;
      case "n":
        return {
          error: `<h3 class="text-red-800">Operation Cancelled</h3>`,
          command: commandWithPrompt,
        };
      default:
        return {
          error: `<h3 class="text-red-800">Invalid Input!</h3>`,
          command: commandWithPrompt,
        };
    }
  }

  // Perform the action on the server
  const response = await action(command, data, device);

  // Actions to be taken based on the response from the server
  if (response.requirePassword) {
    return {
      require: "password",
      command: commandWithPrompt,
    };
  }

  if (response.confirm) {
    return {
      confirm: response.confirm,
      command: commandWithPrompt,
    };
  }

  if (response.requireAmount) {
    return {
      require: "amount",
      command: commandWithPrompt,
    };
  }

  if (response.error) {
    return {
      error: `<h3>${response.error}</h3>`,
      command: commandWithPrompt,
    };
  }

  if (response.logout) {
    await logout();
  }

  if (response.shutdown) {
    redirect("/dashboard");
  }

  if (!response.data) {
    return {
      message: "Server Error",
      command: commandWithPrompt,
    };
  }

  // Format the response data and return it
  const output = COMMANDS[command as keyof typeof COMMANDS].format(response.data);

  return {
    message: output,
    username: response.username,
    clear: COMMANDS[command as keyof typeof COMMANDS].clear,
    command: commandWithPrompt,
  };
}

export const COMMANDS = {
  leaderboard: new Command({
    info: "Gives a list of top 10 hackers all over the world",
    usage: "leaderboard",
    requiresLogin: false,
    format: (data: string) => {
      const parsedData = JSON.parse(data);

      return parsedData
        .map((player: { username: string; balance: number }, index: number) => {
          return `<h3> ${index + 1}. ${player.username} - ${player.balance}</h3>`;
        })
        .join("");
    },
  }),
  hunt: new Command({
    info: "Starts a hacking hunt",
    usage: "hunt",
    requiresLogin: false,
    format: (data: string) => `<h3> - ${data}</h3>`,
  }),
  login: new Command({
    info: "Logs in with the specified username",
    usage: "login [username]",
    requiresLogin: false,
  }),
  balance: new Command({
    info: "Displays the current balance",
    usage: "balance",
  }),
  passwd: new Command({
    info: "Changes the password",
    usage: "passwd",
    confirm: "password",
  }),
  logout: new Command({
    info: "Logs out from hack-a-byte",
    usage: "logout",
  }),
  shutdown: new Command({
    info: "Shuts down the system",
    usage: "shutdown",
  }),
  browse: new Command({
    info: "Fetches Link of random 10 websites",
    usage: "browse [flags]",
    optionalArguments: 1,
    format: (data: string) => {
      const parsedData = JSON.parse(data);

      return parsedData
        .map(
          (
            website: {
              _id: string;
            },
            index: number
          ) => {
            return `<h3> ${index + 1}. https://hack-a-byte.vercel.app/${website._id.toString()}</h3>`;
          }
        )
        .join("");
    },
  }),
  storage: new Command({
    info: "Displays the storage information",
    usage: "storage",
    format: (data: { total: number; used: number; system: number }) => {
      const totalSpace = data.total;
      const usedSpace = data.used + data.system;
      const systemSpace = data.system;
      const freeSpace = data.total - usedSpace;

      function convertToMegaBytes(bytes: number) {
        return bytes / (1024 * 1024);
      }

      return `<h3> Total Space: ${convertToMegaBytes(totalSpace).toFixed(2)} MB</h3>
                 <h3> Used Space: ${convertToMegaBytes(usedSpace).toFixed(2)} MB</h3>
                 <h3> System Space: ${convertToMegaBytes(systemSpace).toFixed(2)} MB</h3>
                 <h3> Free Space: ${convertToMegaBytes(freeSpace).toFixed(2)} MB</h3>`;
    },
  }),
  transactions: new Command({
    info: "Displays the transaction history",
    usage: "transactions",
    format: (data: string) => {
      const parsedData = JSON.parse(data);

      return parsedData.data
        .map(
          (
            transaction: {
              _id: string;
              from: string;
              to: string;
              amount: number;
              date: string;
            },
            index: number
          ) => {
            return `<h3> [${transaction._id.toString()}] - Transferred $${transaction.amount} from ${
              transaction.from === parsedData.username ? "You" : transaction.from
            } to ${transaction.to === parsedData.username ? "You" : transaction.to} on ${new Date(
              transaction.date
            ).toDateString()}</h3>`;
          }
        )
        .join("");
    },
  }),
  clear: new Command({
    info: "Clears the screen",
    usage: "clear",
    format: (data: string) => {
      return "";
    },
    clear: true,
  }),
  transfer: new Command({
    info: "Transfers the specified amount to the receiver",
    usage: "transfer [receiver] [amount]",
    confirm: "process",
    format: (data: { amount: number; receiver: string; transactionId: string }) => {
      return `<h3>- $${data.amount} is Successfully transferred to ${data.receiver}</h3> <h3>transaction code: ${data.transactionId} </h3>`;
    },
  }),
  hint: new Command({
    info: "Provides a hint for the specified username",
    usage: "hint [username]",
    confirm: "hint",
  }),
  visit: new Command({
    info: "Visits the specified link",
    usage: "visit [link]",
  }),
  inbox: new Command({
    info: "Displays the inbox emails",
    usage: "inbox",
    format: (data: string) => {
      const parsedData = JSON.parse(data);

      return parsedData
        .map((email: { sender: string; receiver: string; username: string; link: string }, index: number) => {
          return `<h3> ${index + 1}. ${email.username}: Your daily price:- Visit https://hack-a-byte.vercel.app/${
            email.link
          }</h3>`;
        })
        .join("");
    },
  }),
  email: new Command({
    info: "Sends an email to the receiver",
    usage: "email [receiver] [link] [sender]",
  }),
  outbox: new Command({
    info: "Displays the emails sent by You",
    usage: "outbox",
    format: (data: string) => {
      const parsedData = JSON.parse(data);

      return parsedData
        .map((email: { sender: string; receiver: string; username: string; link: string }, index: number) => {
          return `<h3> ${index + 1}. Send https://hack-a-byte.vercel.app/${email.link} to ${email.receiver}: </h3>`;
        })
        .join("");
    },
  }),
  ham: new Command({
    info: "Installs the specified software",
    usage: "ham install [software]",
    confirm: "install",
  }),
  deploy: new Command({
    info: "Deploys the software if the  softwareId and website link are provided",
    usage: "deploy [softwareId] [link]",
  }),
  scan: new Command({
    info: "Scans for vulnerabilities",
    usage: "scan",
  }),
  hack: new Command({
    info: "Starts hacking the specified website",
    usage: "hack [link]",
  }),
  help: new Command({
    info: "Displays information about the specified command",
    usage: "help [command]",
    requiresLogin: false,
  }),
};
