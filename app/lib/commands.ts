import { Command, Argument } from "@/app/lib/definitions";

// Arguments
const flag = new Argument({ name: "flag", required: false });
const amount = new Argument({ name: "amount", required: true, type: "number" });
const receiver = new Argument({ name: "receiver", required: true, type: "user" });
const username = new Argument({ name: "username", required: true, type: "user" });
const link = new Argument({ name: "link", required: true, type: "url" });
const software = new Argument({ name: "software", required: true, type: "software" });
const softwareId = new Argument({ name: "softwareId", required: true, type: "softwareId" });
const command = new Argument({ name: "command", required: false, type: "command" });
const name = new Argument({ name: "name", required: true, type: "string" });

export const COMMANDS = {
  leaderboard: new Command({
    desc: "Gives a list of top 10 hackers all over the world",
    usage: "leaderboard",
    requiresLogin: false,
  }),
  hunt: new Command({
    desc: "Starts a hacking hunt",
    usage: "hunt",
    requiresLogin: false,
  }),
  login: new Command({
    desc: "Logs in with the specified username",
    usage: "login [username]",
    args: [username],
    requiresLogin: false,
  }),
  balance: new Command({
    desc: "Displays the current balance",
    usage: "balance",
  }),
  passwd: new Command({
    desc: "Changes the password",
    usage: "passwd",
  }),
  chnm: new Command({
    desc: "Changes the username",
    usage: "chnm [new-username]",
    args: [name],
  }),
  logout: new Command({
    desc: "Logs user out from the system",
    usage: "logout",
  }),
  shutdown: new Command({
    desc: "Shuts down the system",
    usage: "shutdown",
    requiresLogin: false,
  }),
  browse: new Command({
    desc: "Fetches Link of random 10 websites",
    usage: "browse [flag]",
    args: [flag],
  }),
  storage: new Command({
    desc: "Displays the storage descrmation",
    usage: "storage",
  }),
  transactions: new Command({
    desc: "Displays the transaction history",
    usage: "transactions",
  }),
  clear: new Command({
    desc: "Clears the screen",
    usage: "clear",
    requiresLogin: false,
  }),
  transfer: new Command({
    desc: "Transfers the specified amount to the receiver",
    usage: "transfer [receiver] [amount]",
    args: [receiver, amount],
  }),
  hint: new Command({
    desc: "Provides a hint for the specified username",
    usage: "hint [username]",
    args: [username],
  }),
  visit: new Command({
    desc: "Visits the specified link",
    usage: "visit [link]",
    args: [link],
  }),
  inbox: new Command({
    desc: "Displays the inbox emails",
    usage: "inbox",
  }),
  email: new Command({
    desc: "Sends an email to the receiver",
    usage: "email [receiver] [link]",
    args: [receiver, link],
  }),
  outbox: new Command({
    desc: "Displays the emails sent by You",
    usage: "outbox",
  }),
  ham: new Command({
    desc: "Installs the specified software",
    usage: "ham install [software]",
    args: [new Argument({ name: "install", required: true, type: "function" }), software],
  }),
  deploy: new Command({
    desc: "Deploys the software if the  softwareId and website link are provided",
    usage: "deploy [softwareId] [link]",
    args: [softwareId, link],
  }),
  scan: new Command({
    desc: "Scans for vulnerabilities",
    usage: "scan",
  }),
  hack: new Command({
    desc: "Starts hacking the specified website",
    usage: "hack [link]",
    args: [link],
  }),
  help: new Command({
    desc: "Displays descrmation about the specified command",
    usage: "help",
    requiresLogin: false,
  }),
};
