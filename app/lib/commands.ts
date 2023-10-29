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
      output: `<h3 class="text-red-800">Sorry Insufficient Credentials!</h3>`,
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
      output: `<h3>Welcome ${username}</h3>`,
      acknowledged: true,
    }; // Greet the user
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
      output: `<h3 class="text-red-800">Sorry Invalid Credentials!</h3>`,
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
      output: `<h3 class="text-red-800">Sorry Invalid Credentials!</h3>`,
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
      output: `<h3 class="text-red-800">Sorry can't find any</h3>`,
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
      output: `<h3 class="text-red-800">Sorry can't find your balance</h3>`,
      acknowledged: false,
    };
  }
}

export async function handleTransfer(
  id: string,
  username: string,
  amount: string
) {
  if (id == "0" || !username || !amount || !Number(amount))
    return {
      output: `<h3 class="text-red-800">Sorry operation was Unsuccessful</h3>`,
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
      output: `<h3 class="text-red-800">Sorry operation was Unsuccessful</h3>`,
      acknowledged: false,
    };
  }
}
