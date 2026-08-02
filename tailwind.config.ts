import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        border: "var(--border)",
        muted: "var(--muted)",
        ink: "var(--ink)",
        mist: "var(--mist)",
        accent: {
          DEFAULT: "var(--accent)",
          ink: "var(--accent-ink)",
        },
        teal: "var(--teal)",
        coral: "var(--coral)",
        sidebar: "var(--sidebar)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(12,18,34,0.04), 0 12px 32px rgba(12,18,34,0.06)",
        glow: "0 0 0 1px rgba(200,241,53,0.4), 0 8px 28px rgba(200,241,53,0.25)",
        float: "0 18px 50px rgba(12,18,34,0.14)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
