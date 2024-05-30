export function getHint(password: string) {
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

  let hints = [
    `the largest digit in the password is ${maxNumber}`,
    `the lowest digit in the password is ${lowestNumber}`,
  ];

  if (consecutive) {
    hints.push("The password is in sequence. e.g 1234");
  }

  if (reverseConsecutive) {
    hints.push("The password is in reverse sequence. e.g 4321");
  }

  if (repeatedPattern) {
    hints.push("The password is a repeated pattern. e.g 1212");
  }

  if (sameDigit) {
    hints.push("The password is of the same digit. e.g 1111");
  }

  // const hints = [
  //   // password: `the pasword is ${password}`
  // ];

  const hint = hints[Math.floor(Math.random() * hints.length)];

  return hint;
}

// Function to convert decimal to binary
export function dec2bin(dec: number) {
  return (dec >>> 0).toString(2);
}

