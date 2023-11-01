import {
  access,
  balance,
  deleteUser,
  login,
  signup,
  transfer,
} from "./actions";

export async function handleSignUp(username: string, password: string) {
  // If password or username is not given
  if (!username || !password) {
    // Return error
    return {
      id: "0",
      output: `<h3>Usage: signup [username] [password -> only 4 characters max]</h3>`,
      acknowledged: false,
    };
  }

  // If password is greater than 4 characters
  if (password.length > 4) {
    // Return error
    return {
      id: "0",
      output: `<h3 class="text-red-800"> password should have less than 5 characters</h3>`,
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
  if (!username || !password) {
    // Return error
    return {
      id: "0",
      output: `<h3>Usage: login [username] [password]</h3>`,
      acknowledged: false,
    };
  }

  // Log in response
  let loggedIn = await login({
    username: username,
    password: password,
  });

  if (loggedIn) {
    return {
      id: loggedIn,
      output: `<h3>Welcome ${username}</h3>`,
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
  if (!username || !password) {
    // Return error
    return {
      output: `<h3>Usage: delete [username] [password]</h3>`,
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

export async function handleTransfer(
  id: string,
  username: string,
  amount: string
) {
  if (id == "0")
    return {
      output: `<h3 class="text-red-800">login first</h3>`,
      acknowledged: false,
    };

  if (!username || !amount)
    return {
      output: `<h3>Usage: transfer [receiver's username] [amount -> only numbers]</h3>`,
      acknowledged: false,
    };

  if (!Number(amount))
    return {
      output: `<h3>amount should be only numbers</h3>`,
      acknowledged: false,
    };

  // Access response
  let transfered = await transfer({
    id: id,
    username: username,
    amount: Number(amount),
  });

  if (transfered) {
    // Return username
    return {
      output: `<h3> - @${amount} is Successfully transferred to ${username}</h3> <h3>Transaction Code: #203487</h3>`,
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

export function handleHelp() {
  let output = `<h3>Commands:</h3>`; // title

  output =
    output +
    `<h3> - signup:         try signup [username] [password -> only 4 characters] </h3>`; // signup
  output =
    output + `<h3> - login:          try login [username] [password] </h3>`; // login
  output = output + `<h3> - logout:         try logout</h3>`; // logout
  output =
    output + `<h3> - delete:         try delete [username] [password] </h3>`; // delete
  output = output + `<h3> - access:         try access</h3>`; // access
  output = output + `<h3> - balance:        try balance</h3>`; // balance
  output =
    output +
    `<h3> - transfer:       try transfer [receiver's username] [amount -> only numbers]</h3>`; // transfer

  // Return output
  return {
    output: output,
    acknowledged: false,
  };
}
