import { Software } from "./definitions";

export const SOFTWARES = {
  tos: new Software({
    name: "tos",
    desc: "A simple ransomware",
    cost: 2000,
    type: "ransomware",
    category: "malware",
  }),
  nobo: new Software({
    name: "nobo",
    desc: "A simple virus",
    cost: 3000,
    type: "virus",
    category: "malware",
  }),
  sii: new Software({
    name: "sii",
    desc: "A simple spyware",
    cost: 1000,
    type: "spyware",
    category: "malware",
  }),
};
