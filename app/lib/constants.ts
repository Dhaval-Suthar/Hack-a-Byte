export const DEFAULT_USERNAME = "0.0.0.0";
export const DEFAULT_USER_ID = "0";
export const DEFAULT_COMPUTER_MODEL = "HackBook-L";
export const ROOT_DIRECTORY = "~";
export const DEFAULT_PASSWORD = "1000";

export const SOFTWARES = {
  virus: {
    cost: 1000,
  },
  ransomware: {
    cost: 500,
  },
  spyware: {
    cost: 200,
  },
};

export const CONFIRMATIONS = {
  process: "",
  hint: "That will Cost: $10",
  virus: `That will Cost: $${SOFTWARES.virus.cost}`,
  ransomware: `That will Cost: $${SOFTWARES.ransomware.cost}}`,
  spyware: `That will Cost: $${SOFTWARES.spyware.cost}`,
  scan: "That will Cost: $50",
  virusDetected: "Virus detected!, Do you want to remove it? That will Cost: $2000",
  spywareDetected: "Spyware detected!, Do you want to remove it? That will Cost: $100",
  repair: "Your computer is damaged, Do you want to repair it? That will Cost: $5000",
};

export const MODELS = {
  L: "Hackbook-L",
  W95: "Hackbook-W95",
};

export const ERRORS = {
  INVALID_CREDENTIALS: "Invalid Credentials",
  LOGIN_REQUIRED: "Login Required",
  SERVER_ERROR: "Server Error",
  NO_USER_FOUND: "No Such User Found",
  USER_ALREADY_EXISTS: "User Already Exists",
  UNKNOWN_ERROR: "Some Unknown Error Occurred",
  INVALID_LOGIN: "Invalid Login",
  INVALID_LINK: "Invalid Link",
  INSUFFICIENT_BALANCE: "Insufficient Balance",
  NO_TRANSACTIONS_FOUND: "No Transactions Found!",
  NO_WEBSITES_FOUND: "No Websites Found!",
  INVALID_PROCESS: "Invalid Process",
  INVALID_SOFTWARE: "Invalid Software",
  INVALID_SOFTWARE_ID: "Invalid SoftwareId",
  NOT_YOUR_WEBSITE: "Not Your Website",
  NO_EMAILS_FOUND: "No Emails Found!",
  EMAIL_ALREADY_SENT: "Can't send more than 1 email to same user",
  USER_NOT_FOUND: "User Not Found",
  PROVIDE_RECEIVER: "Provide Receiver",
  PROVIDE_LINK: "Provide Link",
  INVALID_AMOUNT: "Invalid Amount",
  NEGATIVE_AMOUNT: "Amount can't be less than 0",
  PROVIDE_AMOUNT: "Provide Amount",
  PROVIDE_SOFTWARE_ID: "Provide SoftwareId",
  PROVIDE_USERNAME: "Provide Username",
  INVALID_FLAG: "Invalid Flag",
  PROVIDE_SOFTWARE_NAME: "Provide Software Name",
  INVALID_COMMAND: "Invalid Command",
  ZERO_AMOUNT: "Amount can't be 0",
  DEVICE_NOT_FOUND: "Device Not Found",
};
