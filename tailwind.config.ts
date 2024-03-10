import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  plugins: [
    function ({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        ".hide-scrollbar": {
          "scrollbar-width": "none" /* Firefox */,
          "-ms-overflow-style": "none" /* Internet Explorer 10+ */,
        },
        ".hide-scrollbar::-webkit-scrollbar": {
          display: "none" /* Safari and Chrome */,
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
export default config;
