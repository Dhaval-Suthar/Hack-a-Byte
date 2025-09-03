export class App {
  name: string;
  icon: string;
  fullscreen: boolean;
  metadata?: Record<string, string>;
  id?: string; // Add an optional id property for unique instance identification

  constructor(name: string, icon: string) {
    this.name = name;
    this.icon = icon;
    this.fullscreen = false;
    this.id = `${name}_${Date.now()}`; // Generate a unique ID by default
  }
}

export const APPS: App[] = [
  new App("My Computer", "/hackbook-W95/app-icon/mycomputer.png"),
  new App("Internet Explorer", "/hackbook-W95/app-icon/ie.png"),
  new App("Inbox", "/hackbook-W95/app-icon/inbox.png"),
  new App("Network Neighborhood", "/hackbook-W95/app-icon/nn.png"),
  new App("Recycle Bin", "/hackbook-W95/app-icon/recyclebin.png"),
  new App("Minesweeper", "/hackbook-W95/app-icon/minesweeper.png"),
  new App("CD Player", "/hackbook-W95/app-icon/cdplayer.png"),
  new App("Terminal", "/hackbook-W95/app-icon/terminal.png"),
  new App("Notepad", "/hackbook-W95/app-icon/notepad.png"),
  new App("Calculator", "/hackbook-W95/app-icon/calculator.png"),
  new App("Paint", "/hackbook-W95/app-icon/paint.png"),
  // new App("Solitaire", "/hackbook-W95/app-icon/solitaire.png"), // REMOVED
  new App("WinTalk 95", "/hackbook-W95/app-icon/wintalk.png"),
  new App("Neural Network Analyzer", "/hackbook-W95/app-icon/network.svg"), // Hidden app - will be revealed through gameplay
  new App("Secure Vault", "/hackbook-W95/app-icon/lock.svg"), // Hidden app - will be revealed after neural network completion
  new App("Dev Tools", "/hackbook-W95/app-icon/settings.png"), // Development app for testing missions
];

// Set fullscreen for game apps
APPS.find(app => app.name === "Network Neighborhood")!.fullscreen = true;
APPS.find(app => app.name === "Neural Network Analyzer")!.fullscreen = true;
APPS.find(app => app.name === "Secure Vault")!.fullscreen = true;

// Define window sizes for different app types
export const APP_WINDOW_SIZES: Record<string, { width: string | number; height: string | number }> = {
  "Calculator": { width: 280, height: 400 },
  "Minesweeper": { width: 350, height: 450 },
  "CD Player": { width: 400, height: 300 },
  "Paint": { width: 700, height: 600 },
  "Terminal": { width: 650, height: 500 },
  "WinTalk 95": { width: 500, height: 600 },
  "Dev Tools": { width: 700, height: 600 },
  // Default size for unlisted apps
  "default": { width: '80vw', height: '80vh' }
};

export const DefaultValues = {
  LINK: "https://en.wikipedia.org/wiki/Wikipedia:About",
};
