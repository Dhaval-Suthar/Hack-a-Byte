export enum DefaultValues {
  USERNAME = "0.0.0.0",
  USER_ID = "0",
  COMPUTER_MODEL = "HackBook-L",
  ROOT_DIRECTORY = "~",
  PASSWORD = "1000",
  LINK = "https://www.wikipedia.com",
}

export enum MessageTypes {
  ERROR = "error",
  SUCCESS = "success",
  INFO = "info",
  WARNING = "warning",
}

export enum Confirmations {
  process = "",
  hint = "That will Cost=$10",
  virus = "That will Cost=$1000",
  ransomware = "That will Cost=$500",
  spyware = "That will Cost=$200",
  scan = "That will Cost=$50",
  virusDetected = "Virus detected!, Do you want to remove it? That will Cost=$2000",
  spywareDetected = "Spyware detected!, Do you want to remove it? That will Cost=$100",
  repair = "Your computer is damaged, Do you want to repair it? That will Cost=$5000",
}

export enum Models {
  L = "Hackbook-L",
  W95 = "Hackbook-W95",
}

export enum Success {
  // Common Success
  SUCCESS = "Success",
  DONE = "Done",
  UPDATED = "Updated",
  DELETED = "Deleted",
  ADDED = "Added",
  REMOVED = "Removed",
  SENT = "Sent",
  FOUND = "Found",
  REGISTERED = "Registered",
  LOGGED_IN = "Logged In",
  LOGGED_OUT = "Logged Out",
  PASSWORD_CHANGED = "Password Changed",
  PASSWORD_RESET = "Password Reset",
  PASSWORD_UPDATED = "Password Updated",
  PASSWORD_SENT = "Password Sent",
  PASSWORD_VERIFIED = "Password Verified",
  PASSWORD_RESET_LINK_SENT = "Password Reset Link Sent",
  PASSWORD_RESET_LINK_VERIFIED = "Password Reset Link Verified",
  PASSWORD_RESET_LINK_VALID = "Password Reset Link Valid",
  EMAIL_SENT = "Email Sent",
  DEPLOYED = "Deployed",
  HACKED = "The website have been hacked",
  MALWARE_REMOVED = "Malware Removed",
  DEVICE_BOUGHT = "Device Bought",
  USERNAME_CHANGED = "Username Changed",
}

export enum Errors {
  // Common Errors
  SERVER_ERROR = "Server Error",
  UNKNOWN_ERROR = "Some Unknown Error Occurred",
  SOMETHING_WENT_WRONG = "Something Went Wrong",
  UNAUTHORIZED = "Unauthorized",
  NOT_FOUND = "Not Found",
  INSUFFICIENT_INFO = "Insufficient Information, Please Provide Required Information",
  INVALID_INPUT = "Invalid Input",
  NO_DATA = "No Data Found",
  PREMISSION_DENIED = "Permission Denied",

  // Process Errors
  PROCESS_FAILED = "Process Failed",
  PROCESS_CANCELLED = "Process Cancelled",

  // User Errors
  LOGIN_REQUIRED = "Login Required",
  USER_ALREADY_EXISTS = "User Already Exists",
  USER_ALREADY_LOGGED_IN = "User Already Logged In",
  USERNAME_TAKEN = "Username Taken",
  USERNAME_SHORT = "Username Too Short",
  USERNAME_LONG = "Username Too Long",

  // Invalid Errors
  INVALID_CREDENTIALS = "Invalid Credentials",
  INVALID_LOGIN = "Invalid Login",
  INVALID_LINK = "Invalid Link",
  INVALID_PROCESS = "Invalid Process",
  INVALID_SOFTWARE = "Invalid Software",
  INVALID_SOFTWARE_ID = "Invalid SoftwareId",
  INVALID_AMOUNT = "Invalid Amount",
  INVALID_FLAG = "Invalid Flag",
  INVALID_COMMAND = "Invalid Command",
  INVALID_DEVICE = "Invalid Device",

  // Not Found Errors
  NO_USERS_FOUND = "No Users Found",
  NO_TRANSACTIONS_FOUND = "No Transactions Found!",
  NO_WEBSITES_FOUND = "No Websites Found!",
  NO_EMAILS_FOUND = "No Emails Found!",
  DEVICE_NOT_FOUND = "Device Not Found",
  USER_NOT_FOUND = "User Not Found",
  SOFTWARE_NOT_FOUND = "Software Not Found",
  TRANSACTION_NOT_FOUND = "Transaction Not Found",
  WEBSITE_NOT_FOUND = "Website Not Found",
  COMMAND_NOT_FOUND = "Command Not Found",

  // Unauthorized Errors
  NOT_YOUR_WEBSITE = "Not Your Website",
  DEVICE_NOT_OWNED = "You don't own this device",
  DEVICE_NOT_OWNED_BY_USER = "Device Not Owned By User",

  // Insufficient info Errors
  PROVIDE_RECEIVER = "Provide Receiver",
  PROVIDE_LINK = "Provide Link",
  PROVIDE_AMOUNT = "Provide Amount",
  PROVIDE_SOFTWARE_ID = "Provide SoftwareId",
  PROVIDE_USERNAME = "Provide Username",
  PROVIDE_SOFTWARE_NAME = "Provide Software Name",

  // Misc Errors
  EMAIL_ALREADY_SENT = "Can't send more than 1 email to same user",
  INSUFFICIENT_BALANCE = "Insufficient Balance",
  ZERO_AMOUNT = "Amount can't be 0",
  NEGATIVE_AMOUNT = "Amount can't be less than 0",
  PASSWORD_SHOULD_BE_4_DIGITS = "Password should be 4 digits",
  PASSWORD_SHOULD_BE_ONLY_DIGITS = "Password should be only digits",
  PASSWORDS_DO_NOT_MATCH = "Passwords do not match",
  PASSWORD_INCORRECT = "Password Incorrect",
  CANT_HACK_YOURSELF = "You can't hack yourself",
  CANNOT_TRANSFER_TO_YOURSELF = "You can't transfer to yourself",
  DEVICE_ALREADY_OWNED = "Device Already Owned",
}
