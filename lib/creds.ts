// Shared credential generator for WinTalk 95 and related apps

function randomUsername() {
  const agents = ["ghost", "phantom", "cipher", "shadow", "specter", "wraith", "nova", "echo", "zero", "omega"];
  const suffix = String(Math.floor(100 + Math.random() * 900));
  return `${agents[Math.floor(Math.random() * agents.length)]}_agent_${suffix}`;
}

function randomPassword() {
  const words = ["PHANTOM", "GHOST", "SHADOW", "CRYPTIC", "NOVA", "OMEGA", "SPECTER", "WRAITH", "ECHO", "ZERO"];
  const year = 90 + Math.floor(Math.random() * 10); // 90-99
  return `${words[Math.floor(Math.random() * words.length)]}${year}`;
}

// Singleton pattern: credentials are generated once per session
let creds: { username: string; password: string } | null = null;

export function getSessionCreds() {
  if (!creds) {
    creds = {
      username: randomUsername(),
      password: randomPassword(),
    };
  }
  return creds;
}
