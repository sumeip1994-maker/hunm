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
        },
        studio: {
          ink: "#15072e",
          purple: "#50308c",
          violet: "#6d3aa6",
          magenta: "#e33b8b",
          lime: "#bedf63",
          mist: "#f7f4fb"
        }
      }
    }
  },
  plugins: []
};

export default config;
