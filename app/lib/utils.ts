import { fetchUserPassword } from "./actions";

export async function askForPassword(passwordType: string) {
  const passwordElement = document.createElement("li");
  const consoleElement = document.getElementById("console-element");
  const promptElement = document.getElementById("command-prompt");
  const passwordInputElement = document.createElement("input");

  function focusInput() {
    passwordInputElement.focus();
  }

  // Properties of passwordInputElement
  passwordInputElement.type = "password";
  passwordInputElement.style.background = "transparent";
  passwordInputElement.style.color = "transparent";
  passwordInputElement.style.width = "0px";
  passwordInputElement.style.outline = "none";

  // Properties of passwordElement
  passwordElement.style.display = "flex";
  passwordElement.innerHTML = `
      <h3 class="flex">${passwordType}:
        <div class="w-4 h-5 rounded-md bg-gray-400 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 -rotate-45 m-auto text-black">
            <path fill-rule="evenodd" d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 0 0-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5A.75.75 0 0 0 9 19.5V18h1.5a.75.75 0 0 0 .53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z" clip-rule="evenodd" />
          </svg>
        </div>
      </h3>`;

  // Add passwordInputElement
  passwordElement.appendChild(passwordInputElement);
  consoleElement?.appendChild(passwordElement);

  // Focus passwordInputElement for every key down
  window.addEventListener("keydown", focusInput);
  window.addEventListener("click", focusInput);

  // Wait till user enters the password
  return await new Promise<string>(
    (resolve) =>
      (passwordInputElement.onkeydown = (e) => {
        if (e.key === "Enter") {
          // Remove the event listeners
          window.removeEventListener("keydown", focusInput);
          window.removeEventListener("click", focusInput);

          // Remove passwordInputElement
          passwordElement && consoleElement?.removeChild(passwordElement);

          // Add the prompt back
          promptElement && consoleElement?.appendChild(promptElement);

          resolve(passwordInputElement.value);
        }
      })
  );
}

export async function genHint(username: string) {
  // take username of the account to hack as input
  const password = await fetchUserPassword(username);

  if (password.error) {
    return { error: password.error, hints: {} };
  }

  let consecutive = true;
  let reverseConsecutive = true;
  let repeatedPattern = true;
  let sameDigit = true;
  let maxNumber = -Infinity;

  for (let i = 0; i < password.length; i++) {
    const currentDigit = parseInt(password[i]);
    if (currentDigit > maxNumber) {
      maxNumber = currentDigit;
    }
  }

  let lowestNumber = Infinity;
  for (let i = 0; i < password.length; i++) {
    const currentDigit = parseInt(password[i]);
    if (currentDigit < lowestNumber) {
      lowestNumber = currentDigit;
    }
  }

  for (let i = 0; i < password.length; i++) {
    const currentDigit = parseInt(password[i]);
    const previousDigit = parseInt(password[i - 1]);

    if (currentDigit !== previousDigit + 1) {
      consecutive = false;
    }

    if (currentDigit !== previousDigit - 1) {
      reverseConsecutive = false;
    }

    if (password[i] !== password[i - 1]) {
      repeatedPattern = false;
    }

    if (currentDigit !== parseInt(password[0])) {
      sameDigit = false;
      break;
    }
  }

  if (sameDigit) {
    repeatedPattern = false;
  }

  return {
    hints: {
      isCons: consecutive ? "The password is in sequence. e.g 1234" : false,
      isReverseCon: reverseConsecutive ? "the password is in reverse sequence. e.g 5432" : false,
      isRepeatedPattern: repeatedPattern ? "the password is a repeated pattern. e.g 1212" : false,
      isSameDigit: sameDigit ? "the password is of the same digit. e.g 1111" : false,
      maxNumber: `the largest digit in the password is ${maxNumber}`,
      lowestNumber: `the lowest digit in the password is ${lowestNumber}`,
      // password: `the pasword is ${password}`
    },
  };
  // give the user the hint and make sure his 30-rs gets debited/
}

// Function to convert decimal to binary
export function dec2bin(dec: number) {
  return (dec >>> 0).toString(2);
}
