import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        domicha: {
          ink: "#1f2933",
          tea: "#2f6f4e",
          leaf: "#7fb069",
          milk: "#f7f3ea",
          line: "#d8d2c2"
        }
      }
    }
  },
  plugins: []
};

export default config;
