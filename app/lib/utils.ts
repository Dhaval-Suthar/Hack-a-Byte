export function getHint(password: string) {
  const passwordDigits = password.split("").map(Number);

  const maxNumber = Math.max(...passwordDigits);
  const lowestNumber = Math.min(...passwordDigits);

  let hints = [
    `the largest digit in the password is ${maxNumber}`,
    `the lowest digit in the password is ${lowestNumber}`,
  ];

  // Check for repeating digits
  const repeatingDigits = passwordDigits.filter((digit, index) => passwordDigits.indexOf(digit) !== index);
  if (repeatingDigits.length > 0) {
    hints.push(`there are repeating digits in the password`);

    const repeatingDigitsCount = repeatingDigits.reduce((acc: { [key: number]: number }, digit) => {
      if (acc[digit]) {
        acc[digit] += 1;
      } else {
        acc[digit] = 1;
      }
      return acc;
    }, {});

    repeatingDigits.forEach((digit) => {
      hints.push(`the digit ${digit} is repeating`);
      hints.push(`the digit ${digit} is repeating ${repeatingDigitsCount[digit]} times`);
    });
  }

  // Check for even or odd
  const evenDigits = passwordDigits.filter((digit) => digit % 2 === 0);
  const oddDigits = passwordDigits.filter((digit) => digit % 2 !== 0);

  if (evenDigits.length > 0) {
    hints.push(`there are even digits in the password`);
    hints.push(`there are ${evenDigits.length} even digits in the password`);
  } else {
    hints.push(`there are no even digits in the password`);
  }

  if (oddDigits.length > 0) {
    hints.push(`there are odd digits in the password`);
    hints.push(`there are ${oddDigits.length} odd digits in the password`);
  } else {
    hints.push(`there are no odd digits in the password`);
  }

  // Check for binary
  const binaryDigits = passwordDigits.filter((digit) => digit === 0 || digit === 1);
  if (binaryDigits.length > 0) {
    hints.push(`there are binary digits in the password`);
    hints.push(`there are ${binaryDigits.length} binary digits in the password`);
  } else {
    hints.push(`there are no binary digits in the password`);
  }

  // Check for prime
  const primeDigits = passwordDigits.filter((digit) => {
    for (let i = 2; i < digit; i++) if (digit % i === 0) return false;
    return digit > 1;
  });

  if (primeDigits.length > 0) {
    hints.push(`there are prime digits in the password`);
    hints.push(`there are ${primeDigits.length} prime digits in the password`);
  } else {
    hints.push(`there are no prime digits in the password`);
  }

  // Check for palindrome
  const isPalindrome = passwordDigits.join("") === passwordDigits.reverse().join("");

  if (isPalindrome) {
    hints.push(`the password is a palindrome`);
  } else {
    hints.push(`the password is not a palindrome`);
  }

  // Check for ascending order
  const isAscending = passwordDigits.join("") === passwordDigits.sort().join("");

  if (isAscending) {
    hints.push(`the digits are in ascending order`);
  } else {
    hints.push(`the digits are not in ascending order`);
  }

  // Check for descending order
  const isDescending = passwordDigits.join("") === passwordDigits.sort().reverse().join("");

  if (isDescending) {
    hints.push(`the digits are in descending order`);
  } else {
    hints.push(`the digits are not in descending order`);
  }

  // Check for sum
  const sum = passwordDigits.reduce((acc, digit) => acc + digit, 0);

  hints.push(`the sum of the digits is ${sum}`);

  // Check for product
  const product = passwordDigits.reduce((acc, digit) => acc * digit, 1);

  hints.push(`the product of the digits is ${product}`);

  // Check for square
  const isSquare = Math.sqrt(Number(password)) % 1 === 0;

  if (isSquare) {
    hints.push(`the password is a square number`);
  } else {
    hints.push(`the password is not a square number`);
  }

  // Check for cube
  const isCube = Math.cbrt(Number(password)) % 1 === 0;

  if (isCube) {
    hints.push(`the password is a cube number`);
  } else {
    hints.push(`the password is not a cube number`);
  }

  // Check for fibonacci
  const isFibonacci =
    [0, 1].includes(Number(password)) ||
    passwordDigits.every((digit, index) => digit === passwordDigits[index - 1] + passwordDigits[index - 2]);

  if (isFibonacci) {
    hints.push(`the password is a fibonacci number`);
  } else {
    hints.push(`the password is not a fibonacci number`);
  }

  // Check for consecutive numbers
  const isConsecutive = passwordDigits.every((digit, index) => digit === passwordDigits[index - 1] + 1);

  if (isConsecutive) {
    hints.push(`the digits are consecutive`);
  } else {
    hints.push(`the digits are not consecutive`);
  }

  // Check for reverse consecutive numbers
  const isReverseConsecutive = passwordDigits.every((digit, index) => digit === passwordDigits[index - 1] - 1);

  if (isReverseConsecutive) {
    hints.push(`the digits are reverse consecutive`);
  } else {
    hints.push(`the digits are not reverse consecutive
    `);
  }

  // Check for alternating numbers
  const isAlternating = passwordDigits.every((digit, index) => digit === passwordDigits[index - 1] * -1);

  if (isAlternating) {
    hints.push(`the digits are alternating`);
  } else {
    hints.push(`the digits are not alternating`);
  }

  const hint = hints[Math.floor(Math.random() * hints.length)];

  return hint;
}

// Function to convert decimal to binary
export function dec2bin(dec: number) {
  return (dec >>> 0).toString(2);
}

export function convertToMegaBytes(bytes: number) {
  return bytes / (1024 * 1024);
}
