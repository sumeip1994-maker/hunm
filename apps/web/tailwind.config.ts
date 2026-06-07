import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: "#f5f8fb",
          100: "#e7eef5",
          500: "#356b93",
          700: "#214760",
          900: "#142b3a"
        }
      }
    }
  },
  plugins: []
};

export default config;
