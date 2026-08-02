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
        "ink-soft": "var(--ink-soft)",
        mist: "var(--mist)",
        gold: "var(--gold)",
        rust: "var(--rust)",
        mustard: "var(--mustard)",
        "brand-orange": "var(--orange)",
        accent: {
          DEFAULT: "var(--accent)",
          ink: "var(--accent-ink)",
        },
        /* Legacy aliases — prefer brand-orange / rust / accent in new UI */
        teal: "var(--teal)",
        coral: "var(--coral)",
        sidebar: "var(--sidebar)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(13,27,52,0.04), 0 12px 32px rgba(13,27,52,0.06)",
        glow: "0 0 0 1px rgba(240,180,41,0.4), 0 8px 28px rgba(240,180,41,0.25)",
        float: "0 18px 50px rgba(13,27,52,0.14)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
