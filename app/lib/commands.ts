import { DEFAULT_USER_ID, DEFAULT_USERNAME } from "../page";
import { COMMANDS, Command } from "./Command";
import {
  search,
  admin,
  balance,
  storage,
  deleteUser,
  leaderboard,
  login,
  signup,
  transactions,
  transfer,
  browse,
  browser,
  ham,
  deploy,
} from "./actions";

export async function handleAdmin({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const result = await admin({
    username: argumentList[0],
    password: argumentList[1],
    secretCode: password,
  });

  // If the account is created
  if (!result) {
    return {
      output: `<h3>command not found: admin </h3>`,
    };
  }

  return {
    output: `<h3>Added Successfully. </h3>`,
  };
}

export async function handleSignUp({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const inputUsername = argumentList[0];

  const signedUp = await signup({
    username: inputUsername,
    password: password,
  });

  if (signedUp.id === DEFAULT_USER_ID) {
    return {
      output: `<h3 class="text-red-800">${signedUp.error}!</h3>`,
      acknowledged: false,
    };
  }

  return {
    userData: { id: signedUp.id, username: inputUsername },
    output: `<h3>Last login: never on console</h3> <h3>Welcome ${inputUsername}</h3>`,
    acknowledged: true,
  };
}

export async function handleLogIn({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const inputUsername = argumentList[0];

  const loggedIn = await login({
    username: inputUsername,
    password: password,
  });

  if (loggedIn.id === DEFAULT_USER_ID) {
    return {
      output: `<h3 class="text-red-800">Sorry Invalid Credentials!</h3>`,
      acknowledged: false,
    };
  }

  return {
    userData: { id: loggedIn.id, username: inputUsername },
    output: `<h3>Last login: ${new Date(
      loggedIn.lastLogin
    ).toDateString()} on console</h3> <h3>Welcome ${inputUsername}</h3>`,
    acknowledged: true,
  };
}

export async function handleLogOut({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  if (userId === DEFAULT_USER_ID) {
    return {
      output: `<h3>Already Logged Out</h3>`,
      acknowledged: false,
    };
  }

  return {
    userData: { id: DEFAULT_USER_ID, username: DEFAULT_USERNAME },
    output: `<h3>Logged Out Successfully!</h3>`,
    acknowledged: true,
  };
}

export async function handleDelete({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const deleted = await deleteUser({
    username: username,
    password: password,
  });

  if (!deleted) {
    return {
      output: `<h3 class="text-red-800">Sorry Invalid Credentials!</h3>`,
      acknowledged: false,
    };
  }
  return {
    userData: { id: DEFAULT_USER_ID, username: DEFAULT_USERNAME },
    output: `<h3>${username} Deleted Successfully</h3>`,
    acknowledged: true,
  };
}

export async function handleSearch({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const result = await search();

  if (!result) {
    return {
      output: `<h3 class="text-red-800">Sorry can't find any user</h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - ${result}</h3>`,
    acknowledged: true,
  };
}

export async function handleBalance({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const balanceAmount = await balance(userId);

  if (!balanceAmount) {
    return {
      output: `<h3 class="text-red-800">Sorry Some Error Occured!</h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - @${balanceAmount}</h3>`,
    acknowledged: true,
  };
}

export async function handleStorage({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const storageData = await storage(userId);

  if (!storageData) {
    return {
      output: `<h3 class="text-red-800">Sorry Some Error Occured!</h3>`,
      acknowledged: false,
    };
  }

  const totalSpace = storageData.total;
  const usedSpace = storageData.used;
  const systemSpace = storageData.system;
  const freeSpace = storageData.total - storageData.used;

  function convertToMegaBytes(bytes: number) {
    return bytes / (1024 * 1024);
  }

  return {
    output: `<h3> Total Space: ${convertToMegaBytes(totalSpace).toFixed(2)} MB</h3>
                 <h3> Used Space: ${convertToMegaBytes(usedSpace).toFixed(2)} MB</h3>
                 <h3> System Space: ${convertToMegaBytes(systemSpace).toFixed(2)} MB</h3>
                 <h3> Free Space: ${convertToMegaBytes(freeSpace).toFixed(2)} MB</h3>`,
    acknowledged: true,
  };
}

export async function handleTransfer({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const receiver = argumentList[0];
  const amount = argumentList[1];

  if (receiver == username)
    return {
      output: `<h3>Can't transfer to self</h3>`,
      acknowledged: false,
    };

  const balanceAmount = await balance(username);

  if (balanceAmount < Number(amount))
    return {
      output: `<h3 class="text-red-800">Insufficient balance!</h3>`,
      acknowledged: false,
    };

  const transfered = await transfer({
    sender: username,
    username: receiver,
    amount: Number(amount),
  });

  if (!transfered) {
    return {
      output: `<h3 class="text-red-800">User - ${receiver} might not exists</h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - @${amount} is Successfully transferred to ${receiver}</h3> <h3>transaction code: ${transfered}</h3>`,
    acknowledged: true,
  };
}

export async function handleLeaderboard({
  userId = "",
  username = "",
  password = "",
  command = "",
  argumentList = [],
}) {
  const leaderboardResponse = await leaderboard();

  if (leaderboardResponse === "") {
    return {
      output: "<h3>Lack of Users</h3>",
      acknowledged: false,
    };
  }

  const leaderboardList = JSON.parse(leaderboardResponse);

  if (!leaderboardList[0]) {
    return {
      output: "<h3>Lack of Users</h3>",
      acknowledged: false,
    };
  }

  let output = "";

  // Return Top players
  leaderboardList.map((player: { username: string; balance: number }, index: number) => {
    output = output + `<h3> ${index + 1}. ${player.username} - ${player.balance}</h3>`;
  });

  return {
    output: output,
    acknowledged: true,
  };
}

export async function handleTransactions({
  userId = "",
  username = "",
  password = "",
  command = "",
  argumentList = [],
}) {
  const transactionResponse = await transactions({ name: username });

  if (transactionResponse === "") {
    return {
      output: "Sorry, Some Error Occured!",
      acknowledged: false,
    };
  }

  const transactionList = JSON.parse(transactionResponse);

  if (!transactionList[0]) {
    return {
      output: "No Transactions Found!",
      acknowledged: false,
    };
  }

  let output = "";

  // Return all transactions
  transactionList.map((player: { _id: any; from: String; to: String; amount: number; date: Date }) => {
    output += `<h3> [${player._id.toString()}] - Transferred ${player.amount} from ${
      player.from === username ? "You" : player.from
    } to ${player.to === username ? "You" : player.to} on ${new Date(player.date).toDateString()}</h3>`;
  });

  return {
    output: output,
    acknowledged: true,
  };
}

export async function handleBrowser({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const process = argumentList[0];
  const link = argumentList[1];

  const browserResponse = await browser({
    name: username,
    process: process,
    link: link,
  });

  return {
    output: browserResponse,
    acknowledged: true,
  };
}

export async function handleBrowse({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const browseResponse = await browse();

  if (browseResponse === "") {
    return {
      output: "Sorry, Some Error Occured!",
      acknowledged: false,
    };
  }

  const browseList = JSON.parse(browseResponse); // Parse data

  if (!browseList[0]) {
    return {
      output: "No website found!",
      acknowledged: false,
    };
  }

  let output = "";

  // Return Random websites
  browseList.map(
    (
      website: {
        _id: any;
      },
      index: number
    ) => {
      output = output + `<h3> ${index + 1}. https://hack-a-byte.vercel.app/${website._id.toString()}</h3>`;
    }
  );

  return {
    output: output,
    acknowledged: true,
  };
}

export async function handleHam({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const process = argumentList[0];
  const commandInfo = COMMANDS[command as keyof typeof COMMANDS];

  if (argumentList[0] !== "install") {
    return {
      output: `<h3>Usage: ${command} ${commandInfo.argumentsRequired}</h3>`,
      acknowledged: false,
    };
  }

  const hamResponse = await ham({ user: username, process: process });

  return {
    output: `<h3> - ${hamResponse} </h3>`,
    acknowledged: true,
  };
}

export async function handleDeploy({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const softwareId = argumentList[0];
  const websiteLink = argumentList[1];

  let deployResponse = await deploy({ user: username, websiteLink: websiteLink, softwareId: softwareId });

  return {
    output: `<h3> - ${deployResponse} </h3>`,
    acknowledged: true,
  };
}

export function handleHelp({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const inputCommand = argumentList[0];
  const inputCommandInfo: Command = COMMANDS[inputCommand as keyof typeof COMMANDS];

  if (!inputCommandInfo) {
    return {
      output: `<h3> Unknown command </h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - ${inputCommandInfo.description} </h3>`,
    acknowledged: true,
  };
}

export function handleClear({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const consoleElement = document.getElementById("console-element");

  if (consoleElement === null) return;

  while (consoleElement.childNodes.length > 2) {
    // so that it doesnt clear the top line and command line
    consoleElement.removeChild(consoleElement.children[1]);
  }

  consoleElement.appendChild(document.createElement("h1")); // Adds a h1 tag as the console should have atleast one line

  consoleElement.removeChild(consoleElement.children[0]); // clears the 'clear' command

  return {
    output: "",
    acknowledged: true,
  };
}
