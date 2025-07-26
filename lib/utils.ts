export function generateMacAddress() {
  const hexDigits = "0123456789ABCDEF";
  let macAddress = "";

  for (let i = 0; i < 6; i++) {
    let byte = "";
    for (let j = 0; j < 2; j++) {
      byte += hexDigits[Math.floor(Math.random() * 16)];
    }
    macAddress += byte + (i < 5 ? ":" : "");
  }

  return macAddress;
}
