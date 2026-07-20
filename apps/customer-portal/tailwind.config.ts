import type { Config } from "tailwindcss";
import { travioPreset } from "@travio/config/tailwind";

const config: Config = {
  presets: [travioPreset as Config],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
