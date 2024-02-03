import {
  access,
  admin,
  balance,
  storage,
  deleteUser,
  leaderboard,
  login,
  signup,
  transactions,
  transfer,
} from "./actions";

export async function handleAdmin(
  username: string,
  password: string,
  secretCode: string
) {
  // If password is not given or username is not given or password is not number or password is too long
  if (!username || !password || !Number(password) || password.length > 4) {
    // Return error
    return {
      output: `<h3>command not found: admin </h3>`,
    };
  }

  // Sign up response
  let result = await admin({
    username: username,
    password: password,
    secretCode: secretCode,
  });

  // If the account is created
  if (result) {
    return {
      output: `<h3>Added Successfully. </h3>`,
    };
  } else {
    // Return error
    return {
      output: `<h3>command not found: admin </h3>`,
    };
  }
}

export async function handleSignUp(username: string, password: string) {
  // If password or username is not given
  if (!username) {
    // Return error
    return {
      id: "0",
      output: `<h3>Usage: signup [username]</h3>`,
      acknowledged: false,
    };
  }

  if (!Number(password))
    return {
      id: "0",
      output: `<h3 class="text-red-800">password should be only numbers</h3>`,
      acknowledged: false,
    };

  // If password is greater than 4 characters
  if (password.length > 4) {
    // Return error
    return {
      id: "0",
      output: `<h3 class="text-red-800"> password should have less than 5 digits</h3>`,
      acknowledged: false,
    };
  }

  // Sign up response
  let signedUp = await signup({
    username: username,
    password: password,
  });

  // If the account is created
  if (signedUp) {
    return {
      id: signedUp,
      output: `<h3>Last login: never on console</h3> <h3>Welcome ${username}</h3>`, // Greet the user
      acknowledged: true,
    };
  } else {
    // Return error
    return {
      id: "0",
      output: `<h3 class="text-red-800">Sorry Some Error Occured!</h3>`,
      acknowledged: false,
    };
  }
}

export async function handleLogIn(username: string, password: string) {
  // If password or username is not given
  if (!username) {
    // Return error
    return {
      id: "0",
      output: `<h3>Usage: login [username]</h3>`,
      acknowledged: false,
    };
  }

  // Log in response
  let loggedIn = await login({
    username: username,
    password: password,
  });

  if (loggedIn.id != "0") {
    return {
      id: loggedIn.id,
      output: `<h3>Last login: ${new Date(
        loggedIn.lastLogin
      ).toDateString()} on console</h3> <h3>Welcome ${username}</h3>`,
      acknowledged: true,
    }; // Greet the user
  } else {
    // Return error
    return {
      id: "0",
      output: `<h3 class="text-red-800">Sorry Invalid Credentials!</h3>`,
      acknowledged: false,
    };
  }
}

export async function handleDelete(username: string, password: string) {
  // If password or username is not given
  if (!username) {
    // Return error
    return {
      output: `<h3>Usage: delete [username]</h3>`,
      acknowledged: false,
    };
  }

  // Delete response
  let deleted = await deleteUser({
    username: username,
    password: password,
  });

  if (deleted) {
    // Greet the user
    return {
      output: `<h3>${username} Deleted Successfully</h3>`,
      acknowledged: true,
    };
  } else {
    // Return error
    return {
      output: `<h3 class="text-red-800">Sorry Invalid Credentials!</h3>`,
      acknowledged: false,
    };
  }
}

export async function handleAccess() {
  // Access response
  let username = await access();

  if (username) {
    // Return username
    return {
      output: `<h3> - ${username}</h3>`,
      acknowledged: true,
    };
  } else {
    // Return error
    return {
      output: `<h3 class="text-red-800">Sorry can't find any user</h3>`,
      acknowledged: false,
    };
  }
}

export async function handleBalance(id: string) {
  // Access response
  let balanceAmount = await balance(id);

  if (balanceAmount) {
    // Return username
    return {
      output: `<h3> - @${balanceAmount}</h3>`,
      acknowledged: true,
    };
  } else {
    // Return error
    return {
      output: `<h3 class="text-red-800">Sorry Some Error Occured!</h3>`,
      acknowledged: false,
    };
  }
}

export async function handleStorage(id: string) {
  // Access response
  let storageData = await storage(id);

  if (storageData) {
    const totalSpace = storageData.total;
    const usedSpace = storageData.used;
    const systemSpace = storageData.system;
    const freeSpace = storageData.total - storageData.used;

    const convertToMegaBytes = (bytes: number) => {
      return bytes / (1024 * 1024);
    };

    return {
      output: `<h3> Total Space: ${convertToMegaBytes(totalSpace).toFixed(
        2
      )} MB</h3>
                 <h3> Used Space: ${convertToMegaBytes(usedSpace).toFixed(
                   2
                 )} MB</h3>
                 <h3> System Space: ${convertToMegaBytes(systemSpace).toFixed(
                   2
                 )} MB</h3>
                 <h3> Free Space: ${convertToMegaBytes(freeSpace).toFixed(
                   2
                 )} MB</h3>`,
      acknowledged: true,
    };
  } else {
    // Return error
    return {
      output: `<h3 class="text-red-800">Sorry Some Error Occured!</h3>`,
      acknowledged: false,
    };
  }
}

export async function handleTransfer(
  sender: string,
  username: string,
  amount: string
) {
  if (sender == "0.0.0.0")
    return {
      output: `<h3 class="text-red-800">login first</h3>`,
      acknowledged: false,
    };

  if (!username || !amount)
    return {
      output: `<h3>Usage: transfer [receiver's username] [amount -> only numbers]</h3>`,
      acknowledged: false,
    };

  if (username == sender)
    return {
      output: `<h3>Can't transfer to self</h3>`,
      acknowledged: false,
    };

  if (Number(amount) <= 0)
    return {
      output: `<h3>amount should be greater than 0</h3>`,
      acknowledged: false,
    };

  if (!Number(amount))
    return {
      output: `<h3>amount should be only numbers</h3>`,
      acknowledged: false,
    };

  let balanceAmount = await balance(sender);

  if (balanceAmount < Number(amount))
    return {
      output: `<h3 class="text-red-800">Insufficient balance!</h3>`,
      acknowledged: false,
    };

  // Access response
  let transfered = await transfer({
    sender: sender,
    username: username,
    amount: Number(amount),
  });

  if (transfered) {
    // Return username
    return {
      output: `<h3> - @${amount} is Successfully transferred to ${username}</h3> <h3>transaction code: ${transfered}</h3>`,
      acknowledged: true,
    };
  } else {
    // Return error
    return {
      output: `<h3 class="text-red-800">User - ${username} might not exists</h3>`,
      acknowledged: false,
    };
  }
}

export async function handleleaderboard() {
  let output = "";

  // Access response
  let leaderboardResponse = await leaderboard();

  if (leaderboardResponse === "") {
    return {
      output: output,
      acknowledged: false,
    };
  }

  let leaderboardList = JSON.parse(leaderboardResponse); // Parse data

  if (leaderboardList[0]) {
    // Return all players in a h3 tag
    leaderboardList.map(
      (player: { username: string; balance: number }, index: number) => {
        output =
          output +
          `<h3> ${index + 1}. ${player.username} - ${player.balance}</h3>`;
      }
    );

    // Return output
    return {
      output: output,
      acknowledged: true,
    };
  } else {
    // Return error
    return {
      output: `<h3>No one is at the top.</h3>`,
      acknowledged: false,
    };
  }
}

export async function handletransactions(name: string) {
  if (name == "0.0.0.0")
    return {
      output: `<h3 class="text-red-800">login first</h3>`,
      acknowledged: false,
    };

  let output = "";

  // Access response
  let transactionResponse = await transactions({ name: name });

  if (transactionResponse === "") {
    return {
      output: output,
      acknowledged: false,
    };
  }

  let transactionList = JSON.parse(transactionResponse); // Parse data

  if (transactionList[0]) {
    // Return all players in a h3 tag
    transactionList.map(
      (
        player: {
          _id: any;
          from: String;
          to: String;
          amount: number;
          date: Date;
        },
        index: number
      ) => {
        output =
          output +
          `<h3> [${player._id.toString()}] - Transferred ${
            player.amount
          } from ${player.from === name ? "You" : player.from} to ${
            player.to === name ? "You" : player.to
          } on ${new Date(player.date).toDateString()}</h3>`;
      }
    );

    // Return output
    return {
      output: output,
      acknowledged: true,
    };
  } else {
    // Return error
    return {
      output: `<h3>No transactions done yet.</h3>`,
      acknowledged: false,
    };
  }
}

export function handleHelp() {
  let output = `<h3>Commands:</h3>`; // title

  output = output + `<h3> - leaderboard: try leaderboard</h3>`; // leaderboard
  output = output + `<h3> - signup: try signup [username] </h3>`; // signup
  output = output + `<h3> - login: try login [username] </h3>`; // login
  output = output + `<h3> - logout: try logout</h3>`; // logout
  output = output + `<h3> - delete: try delete [username] </h3>`; // delete
  output = output + `<h3> - access: try access</h3>`; // access
  output = output + `<h3> - balance: try balance</h3>`; // balance
  output =
    output +
    `<h3> - transfer: try transfer [receiver's username] [amount -> only numbers]</h3>`; // transfer

  // Return output
  return {
    output: output,
    acknowledged: false,
  };
}
