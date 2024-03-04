import { DEFAULT_USER_ID, DEFAULT_USERNAME, ERRORS } from "./constants";
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
  email,
  inbox,
  detect,
  changePassword,
} from "./actions";
import { askForPassword } from "./utils";

export async function handleAdmin({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const response = await admin(argumentList[0], argumentList[1], password);

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
    };
  }

  if (!response.added) {
    return {
      output: `<h3>command not found: admin</h3>`,
    };
  }

  return {
    output: `<h3>Added Successfully. </h3>`,
  };
}

export async function handleSignUp({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const inputUsername = argumentList[0];

  const response = await signup(inputUsername, password);

  if (response.error) {
    return {
      output: `<h3 class="text-red-800">${response.error}!</h3>`,
      acknowledged: false,
    };
  }

  if (!response.id) {
    return {
      output: `<h3>Sorry! Some Error Occured!</h3> `,
      acknowledged: false,
    };
  }

  return {
    userData: { id: response.id, username: inputUsername },
    output: `<h3>Last login: never on console</h3> <h3>Welcome ${inputUsername}</h3>`,
    acknowledged: true,
  };
}

export async function handleLogIn({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const inputUsername = argumentList[0];

  const response = await login(inputUsername, password);

  if (response.error) {
    return {
      output: `<h3 class="text-red-800">${response.error}!</h3>`,
      acknowledged: false,
    };
  }

  if (!response.id) {
    return {
      output: `<h3>Sorry! Some Error Occured!</h3> `,
      acknowledged: false,
    };
  }

  return {
    userData: { id: response.id, username: inputUsername },
    output: `<h3>Last login: ${new Date(
      response.lastLogin
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
  const response = await deleteUser(username, password);

  if (response.error) {
    return {
      output: `<h3 class="text-red-800">${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response.deleted) {
    return {
      output: `<h3 class="text-red-800">Sorry Some Error Occured</h3>`,
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
  const response = await search();

  if (response.error) {
    return {
      output: `<h3 class="text-red-800">${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response) {
    return {
      output: `<h3 class="text-red-800">Sorry can't find any user</h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - ${response.username}</h3>`,
    acknowledged: true,
  };
}

export async function handleBalance({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const response = await balance(userId);

  if (response.error) {
    return {
      output: `<h3 class="text-red-800">${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response) {
    return {
      output: `<h3 class="text-red-800">Sorry Some Error Occured!</h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - @${response.balance}</h3>`,
    acknowledged: true,
  };
}

export async function handleStorage({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const response = await storage(userId);

  if (response.error) {
    return {
      output: `<h3 class="text-red-800">${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response) {
    return {
      output: `<h3 class="text-red-800">Sorry Some Error Occured!</h3>`,
      acknowledged: false,
    };
  }

  const totalSpace = response.total;
  const usedSpace = response.used;
  const systemSpace = response.system;
  const freeSpace = response.total - response.used;

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

  const transfered = await transfer(userId, receiver, Number(amount));

  if (transfered.error) {
    return {
      output: `<h3 class="text-red-800">${transfered.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!transfered.success) {
    return {
      output: `<h3 class="text-red-800">Sorry! Some Error Occured!</h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - @${amount} is Successfully transferred to ${receiver}</h3> <h3>${transfered.success}</h3>`,
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
  const response = await leaderboard();

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response.data)
    return {
      output: `<h3>Lack of Users</h3>`,
      acknowledged: false,
    };

  const playerList = JSON.parse(response.data);

  let output = "";

  // Return players
  playerList.map((player: { username: string; balance: number }, index: number) => {
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
  const response = await transactions(username);

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response.data)
    return {
      output: `<h3>Lack of Users</h3>`,
      acknowledged: false,
    };

  const transactionList = JSON.parse(response.data);

  let output = "";

  // Return all transactions
  transactionList.map((transaction: { _id: any; from: String; to: String; amount: number; date: Date }) => {
    output += `<h3> [${transaction._id.toString()}] - Transferred ${transaction.amount} from ${
      transaction.from === username ? "You" : transaction.from
    } to ${transaction.to === username ? "You" : transaction.to} on ${new Date(transaction.date).toDateString()}</h3>`;
  });

  return {
    output: output,
    acknowledged: true,
  };
}

export async function handleBrowser({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const process = argumentList[0];
  const link = argumentList[1];

  const response = await browser(userId, process, link);

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response.success) {
    return {
      output: `<h3>Sorry Some Error Occured</h3>`,
      acknowledged: false,
    };
  }

  if (response.encrypted) {
    return {
      output: `<h3>${response.success}</h3><h3>Transfer $${response.money} to hacker to decrypt the data</h3><h3>If failed to do so, you won't be able to login for 2 days</h3><h3 class="text-yellow-300">Warning: Do not log out.</h3>`,
      acknowledged: true,
    };
  }

  return {
    output: `<h3>${response.success}</h3>`,
    acknowledged: true,
  };
}

export async function handleBrowse({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const response = await browse(username);

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response.data)
    return {
      output: `<h3>No website found</h3>`,
      acknowledged: false,
    };

  const websiteList = JSON.parse(response.data);

  let output = "";

  // Return websites
  websiteList.map(
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
  const software = argumentList[1];
  const commandInfo = COMMANDS[command as keyof typeof COMMANDS];

  if (process !== "install") {
    return {
      output: `<h3>Usage: ${command} ${commandInfo.argumentsRequired}</h3>`,
      acknowledged: false,
    };
  }

  const response = await ham(userId, software);

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response.success) {
    return {
      output: `<h3>Sorry Some Error Occured</h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - ${response.success} </h3>`,
    acknowledged: true,
  };
}

export async function handleDeploy({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const softwareId = argumentList[0];
  const websiteLink = argumentList[1];
  const money = argumentList[2] || "1000";

  let response = await deploy(userId, websiteLink, softwareId, money);

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response.success) {
    return {
      output: `<h3>Sorry Some Error Occured</h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - ${response.success} </h3>`,
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

export async function handleEmail({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const response = await email(userId, argumentList[0], argumentList[1], argumentList[2]);

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response.success)
    return {
      output: `<h3>${ERRORS.SERVER_ERROR}</h3>`,
      acknowledged: false,
    };

  return {
    output: response.success,
    acknowledged: true,
  };
}

export async function handleInbox({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const response = await inbox(userId);

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response.data)
    return {
      output: `<h3>No emails received yet</h3>`,
      acknowledged: false,
    };

  const emailList = JSON.parse(response.data);

  let output = "";

  // Return all new emails
  emailList.map((mail: { sender: string; receiver: string; username: string; link: string }, index: number) => {
    output += `<h3> ${index + 1}. ${mail.username}: Your daily price:- Visit ${mail.link}</h3>`;
  });

  // Add a warning at last
  output += `<h3 class="text-yellow-300">Note: Once Fetched, the mails are automatically deleted.</h3>`;

  return {
    output: output,
    acknowledged: true,
  };
}

export async function handleDetect({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const process = argumentList[0];
  const commandInfo = COMMANDS[command as keyof typeof COMMANDS];

  if (process !== "spyware") {
    return {
      output: `<h3>Usage: ${command} ${commandInfo.argumentsRequired}</h3>`,
      acknowledged: false,
    };
  }

  const response = await detect(userId);

  if (response.error) {
    return {
      output: `<h3>${response.error}</h3>`,
      acknowledged: false,
    };
  }

  if (!response) {
    return {
      output: `<h3 class="text-red-800">Sorry can't detect any spyware</h3>`,
      acknowledged: false,
    };
  }

  return {
    output: `<h3> - ${response.success}</h3>`,
    acknowledged: true,
  };
}

export async function handlePassChange({ userId = "", username = "", password = "", command = "", argumentList = [] }) {
  const inputUsername = argumentList[0];

  // check if the current password is correct.
  let response = await login(username, password);
  if (response.error) {
    return {
      output: `<h3 class="text-red-800">Credentials didn't match!</h3>`,
      acknowledged: false,
    };
  }

  // ask for new password
  let newPassword = await askForPassword("New password");
  if (newPassword === await askForPassword("Confirm new password")) { 
    // change the password
    let response = await changePassword(username, newPassword);

    if (response.success) { 
      return {
        output: `<h3>Password has been successfully changed.</h3>`,
        acknowledged: true
      }
    } else { 
      return {
        output: `<h3 class="text-red-800">${response.error}!</h3>`,
        acknowledged: false,
      };
    }

  } else { 
    // return error new password didnt match
    return { 
      output: `<h3 class="text-red-800">New password didn't match!</h3>`,
      acknowledged: false,
    }
  }
}