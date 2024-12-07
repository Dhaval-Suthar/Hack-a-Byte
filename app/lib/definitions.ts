import { Errors } from "./constants";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Device = {
  id: string;
  name: string;
  description: string;
  image: string;
  owned: boolean;
  price: number;
  password: string;
};

export class ProcessState {
  error: string;
  command: string;
  message: string;
  requires: string;
  newlogin: { username: string };
  clear: boolean;
  shutdown: boolean;
  data: any;

  constructor({
    command = "",
    error = "",
    message = "",
    requires = "",
    newlogin = { username: "" },
    clear = false,
    shutdown = false,
    data = {},
  }: {
    command?: string;
    error?: string;
    message?: string;
    requires?: string;
    newlogin?: { username: string };
    clear?: boolean;
    shutdown?: boolean;
    data?: any;
  }) {
    this.command = command;
    this.error = error;
    this.message = message;
    this.requires = requires;
    this.newlogin = newlogin;
    this.clear = clear;
    this.shutdown = shutdown;
    this.data = data;
  }

  toPlainObject() {
    return {
      command: this.command,
      error: this.error,
      message: this.message,
      requires: this.requires,
      newlogin: this.newlogin,
      clear: this.clear,
      shutdown: this.shutdown,
      data: this.data,
    };
  }
}

export class App {
  name: string;
  icon: string;
  fullscreen: boolean;

  constructor(name: string, icon: string) {
    this.name = name;
    this.icon = icon;
    this.fullscreen = false;
  }
}

export class Command {
  desc: string;
  usage: string;
  clearTerminal: Boolean;
  requiresLogin: Boolean;
  args: Argument[];

  constructor({ desc, args = [], usage, clearTerminal = false, requiresLogin = true }: {
    desc: string;
    usage: string;
    args?: Argument[];
    clearTerminal?: Boolean;
    requiresLogin?: Boolean;
  }) {
    this.desc = desc;
    this.usage = usage;
    this.args = args;
    this.clearTerminal = clearTerminal;
    this.requiresLogin = requiresLogin;
  }
}

export class Argument {
  name: string;
  required: boolean;
  type: string;
  checkInDB: boolean;
  notFoundError: string;

  constructor({
    name,
    required = true,
    type = "string",
    checkInDB = false,
    notFoundError = Errors.NOT_FOUND,
  }: {
    name: string;
    required?: boolean;
    type?: string;
    checkInDB?: boolean;
    notFoundError?: string;
  }) {
    this.name = name;
    this.required = required;
    this.type = type;
    this.checkInDB = checkInDB;
    this.notFoundError = notFoundError;
  }
}

export class Software {
  name: String;
  desc: string;
  owner: string ;
  cost: number;
  type: string;
  ask: number;
  message: string;
  category: string;
  installationDate: Date;

  constructor({
    name,
    desc,
    cost,
    category,
    type,
    ask = 0,
    message = "",
    owner = "",
    installationDate = new Date(),
  }: {
    name: string;
    desc: string;
    category: string;
    cost: number;
    type: string;
    ask?: number;
    message?: string;
    owner?: string;
    installationDate?: Date
  }) {
    this.name = name;
    this.desc = desc;
    this.category = category;
    this.cost = cost;
    this.type = type;
    this.ask = ask;
    this.owner = owner;
    this.message = message;
    this.installationDate = installationDate;
  }
}
