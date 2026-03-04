/**
 * 경로: /tailwind.config.ts
 * 프로젝트의 프리미엄 컬러와 서체를 정의합니다.
 */
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
        brand: {
          primary: "#1E40AF",   // Deep Blue
          accent: "#D4AF37",    // Gold
          background: "#F9FAFB", // Light Gray
          text: "#111827",      // Rich Black
        }
      },
      fontFamily: {
        serif: ["var(--font-noto-serif)", "serif"],
        sans: ["var(--font-noto-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;