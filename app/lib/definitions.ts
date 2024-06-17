export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type State = {
  error?: string | null;
  message?: string | null;
  command?: string | null;
  username?: string | null;
  require?: string | null;
  password?: string | null;
  confirm?: string | null;
  clear?: Boolean;
};

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
  confirm: string;
  optionalArguments: number;
  usage: string;
  clear: Boolean;
  format: Function;
  info: string;
  requiresLogin: Boolean = true;

  constructor({
    confirm = "none",
    optionalArguments = 0,
    usage,
    clear = false,
    format = (data: string) => `<h3>${data}</h3>`,
    info,
    requiresLogin = true,
  }: {
    requiresPassword?: boolean;
    confirm?: string;
    optionalArguments?: number;
    usage: string;
    clear?: Boolean;
    format?: Function;
    requiresLogin?: Boolean;
    info: string;
  }) {
    this.confirm = confirm;
    this.optionalArguments = optionalArguments;
    this.usage = usage;
    this.clear = clear;
    this.format = format;
    this.info = info;
    this.requiresLogin = requiresLogin;
  }
}
