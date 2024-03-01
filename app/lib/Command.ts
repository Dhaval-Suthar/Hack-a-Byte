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
} from "./commands";

export class Command {
  description: string;
  argumentsRequired: string;
  requiresPassword: boolean;
  requiresConfirmation: boolean;
  requiresLogin: boolean;
  hidden: boolean;
  loadingText: string;
  info: string;
  action: Function;

  constructor({
    description = "",
    argumentsRequired = "",
    requiresPassword = false,
    requiresConfirmation = false,
    requiresLogin = false,
    hidden = false,
    loadingText = "Processing...",
    info = "",
    action = ({ userId = "", username = "", password = "", command = "", argumentsList = [] }) => {},
  }) {
    this.description = description;
    this.argumentsRequired = argumentsRequired;
    this.requiresPassword = requiresPassword;
    this.requiresConfirmation = requiresConfirmation;
    this.requiresLogin = requiresLogin;
    this.hidden = hidden;
    this.loadingText = loadingText;
    this.info = info;
    this.action = action;
  }
}

// List of commands
export const COMMANDS = {
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
  search: new Command({
    description: "Gives a random account you could try to hack",
    loadingText: "Searching...",
    action: handleSearch,
  }),
  admin: new Command({
    description: "Secret command to do admin tasks",
    argumentsRequired: "[username] [password]",
    requiresPassword: true,
    hidden: true,
    action: handleAdmin,
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
  delete: new Command({
    description: "Permanently deletes your account",
    requiresPassword: true,
    requiresLogin: true,
    loadingText: "Deleting...",
    action: handleDelete,
  }),
  help: new Command({
    description: "Shows description of the command you pass as argument",
    argumentsRequired: "[command]",
    action: handleHelp,
  }),
  signup: new Command({
    description: "Creates a new account",
    argumentsRequired: "[username]",
    requiresPassword: true,
    loadingText: "Signing up...",
    action: handleSignUp,
  }),
  transfer: new Command({
    description: "Transfer money from one user to another",
    argumentsRequired: "[receiver] [amount]",
    requiresPassword: true,
    requiresConfirmation: true,
    requiresLogin: true,
    loadingText: "Transferring...",
    action: handleTransfer,
  }),
  browser: new Command({
    description: "Used to hack websites and to install malwares on websites",
    argumentsRequired: "hack [website link]",
    requiresLogin: true,
    loadingText: "Hacking...",
    action: handleBrowser,
  }),
  browse: new Command({
    description: "Gives random 10 website links",
    requiresLogin: true,
    loadingText: "Fetching websites...",
    action: handleBrowse,
  }),
  ham: new Command({
    description: "ham is a package manager which let you install various softwares and malwares",
    argumentsRequired: "install [software id]",
    requiresConfirmation: true,
    requiresLogin: true,
    loadingText: "Installing...",
    info: `<h3> - Virus: @1000</h3>`,
    action: handleHam,
  }),
  leaderboard: new Command({
    description: "Gives a list of top 10 hackers all over the world",
    loadingText: "Fetching Top 10 Hackers...",
    action: handleLeaderboard,
  }),
  transactions: new Command({
    description: "Shows your transaction history",
    requiresLogin: true,
    loadingText: "Fetching transactions...",
    action: handleTransactions,
  }),
  clear: new Command({ description: "Clears terminal history", loadingText: "Clearing", action: handleClear }),
  deploy: new Command({
    description: "Used to deploy a malware on a website you own",
    argumentsRequired: "[software id] [your website link]",
    requiresLogin: true,
    loadingText: "Deploying...",
    action: handleDeploy,
  }),
};
