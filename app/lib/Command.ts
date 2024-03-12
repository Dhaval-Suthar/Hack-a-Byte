import {
  handleSearch,
  handleAdmin,
  handleBalance,
  handleStorage,
  handleDelete,
  handleHelp,
  handleLogIn,
  handleLogOut,
  handleSignUp,
  handleTransfer,
  handleBrowser,
  handleBrowse,
  handleHam,
  handleLeaderboard,
  handleTransactions,
  handleClear,
  handleDeploy,
  handleEmail,
  handleInbox,
  handleDetect,
  handlePassChange,
   handleHint,
  handleMarket,
} from "./commands";

export class Command {
  description: string;
  argumentsRequired: string;
  requiresPassword: boolean;
  passwordType: string;
  requiresConfirmation: boolean;
  requiresLogin: boolean;
  hidden: boolean;
  loadingText: string;
  info: string;
  containsNumberAt: number;
  optionalArguments: string;
  action: Function;

  constructor({
    description = "",
    argumentsRequired = "",
    requiresPassword = false,
    passwordType = 'password',
    requiresConfirmation = false,
    requiresLogin = false,
    hidden = false,
    loadingText = "Processing...",
    containsNumberAt = 0,
    info = "",
    optionalArguments = "",
    action = ({ userId = "", username = "", password = "", command = "", argumentsList = [] }) => {},
  }) {
    this.description = description;
    this.argumentsRequired = argumentsRequired;
    this.requiresPassword = requiresPassword;
    this.passwordType = passwordType;
    this.requiresConfirmation = requiresConfirmation;
    this.requiresLogin = requiresLogin;
    this.hidden = hidden;
    this.loadingText = loadingText;
    this.containsNumberAt = containsNumberAt;
    this.info = info;
    this.optionalArguments = optionalArguments;
    this.action = action;
  }
}

// List of commands
export const COMMANDS = {
  admin: new Command({
    description: "Secret command to do admin tasks",
    argumentsRequired: "[username] [password]",
    requiresPassword: true,
    hidden: true,
    action: handleAdmin,
  }),
  signup: new Command({
    description: "Creates a new account",
    argumentsRequired: "[username]",
    requiresPassword: true,
    loadingText: "Signing up...",
    action: handleSignUp,
  }),
  login: new Command({
    description: "Logs you into your existing account",
    argumentsRequired: "[username]",
    requiresPassword: true,
    loadingText: "Logging in...",
    action: handleLogIn,
  }),
  logout: new Command({
    description: "Logs you out of your account",
    loadingText: "Logging out...",
    action: handleLogOut,
  }),
  delete: new Command({
    description: "Permanently deletes your account",
    requiresPassword: true,
    requiresLogin: true,
    loadingText: "Deleting...",
    action: handleDelete,
  }),
  passwd: new Command({
    description: "Used to change user's pasword.",
    requiresPassword: true,
    passwordType: "current password",
    loadingText: "",
    requiresLogin: true,
    action: handlePassChange,
  }),
  search: new Command({
    description: "Gives a random account you could try to hack",
    loadingText: "Searching...",
    action: handleSearch,
  }),
  leaderboard: new Command({
    description: "Gives a list of top 10 hackers all over the world",
    loadingText: "Fetching Top 10 Hackers...",
    action: handleLeaderboard,
  }),
  browse: new Command({
    description: "Gives list of your hacked website links",
    optionalArguments: "[flags]",
    requiresLogin: true,
    loadingText: "Fetching websites...",
    action: handleBrowse,
  }),
  balance: new Command({
    description: "Gets your account balance",
    requiresLogin: true,
    loadingText: "Fetching balance...",
    action: handleBalance,
  }),
  storage: new Command({
    description: "Gets your computer storage",
    requiresLogin: true,
    loadingText: "Fetching storage...",
    action: handleStorage,
  }),
  transactions: new Command({
    description: "Shows your transaction history",
    requiresLogin: true,
    loadingText: "Fetching transactions...",
    action: handleTransactions,
  }),
  clear: new Command({ description: "Clears terminal history", loadingText: "Clearing", action: handleClear }),
  transfer: new Command({
    description: "Transfer money from one user to another",
    argumentsRequired: "[receiver] [amount]",
    requiresConfirmation: true,
    requiresLogin: true,
    containsNumberAt: 2,
    loadingText: "Transferring...",
    action: handleTransfer,
  }),
  browser: new Command({
    description: "Used to hack websites and to install malwares on websites",
    argumentsRequired: "hack [website-link]",
    requiresLogin: true,
    loadingText: "Hacking...",
    action: handleBrowser,
  }),
  inbox: new Command({
    description: "Gives you a list of emails",
    requiresLogin: true,
    loadingText: "Fetching...",
    action: handleInbox,
  }),
  email: new Command({
    description: "Sends an scam email to a user",
    argumentsRequired: "[receiver] [website-link] [fake-username]",
    requiresLogin: true,
    loadingText: "Sending...",
    action: handleEmail,
  }),
  market: new Command({
    description: "A market place to buy computer models",
    argumentsRequired: "buy [computer-model]",
    requiresConfirmation: true,
    requiresLogin: true,
    loadingText: "Buying...",
    info: `<h3> - Hackbook-W95: $10,000</h3>`,
    action: handleMarket,
  }),
  ham: new Command({
    description: "ham is a package manager which let you install various softwares and malwares",
    argumentsRequired: "install [software-name]",
    requiresConfirmation: true,
    requiresLogin: true,
    loadingText: "Installing...",
    info: `<h3> - Virus: $1000</h3><h3> - Ransomware: $500</h3><h3> - Spyware: $200</h3>`,
    action: handleHam,
  }),
  deploy: new Command({
    description: "Used to deploy a malware on a website you own",
    argumentsRequired: "[software-id] [your-website-link]",
    optionalArguments: "[money](only-for-ransomware)",
    requiresLogin: true,
    loadingText: "Deploying...",
    action: handleDeploy,
  }),
  detect: new Command({
    description: "Detects if a spyware is installed",
    argumentsRequired: "spyware",
    loadingText: "Detecting...",
    requiresLogin: true,
    requiresConfirmation: true,
    action: handleDetect,
  }),
  hint: new Command({
    description: "Provides a clue for hacking the password for 10$",
    loadingText: "Generating hint...",
    requiresLogin: true,
    requiresConfirmation: true,
    argumentsRequired: "[username]",
    action: handleHint,
  }),
  help: new Command({
    description: "Shows description of the command you pass as argument",
    argumentsRequired: "[command]",
    action: handleHelp,
  }),
};
