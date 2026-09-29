/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF7F1",
          2: "#F3EEE4",
          3: "#EAE3D3",
        },
        ink: {
          DEFAULT: "#16130F",
          2: "#3D3830",
          3: "#6E665A",
          4: "#A39B8B",
        },
        forest: {
          DEFAULT: "#1B3A2C",
          2: "#24523E",
          3: "#2E6B52",
          4: "#4A8A6E",
        },
        terra: {
          DEFAULT: "#C65D3B",
          2: "#A8472A",
          3: "#E07A58",
        },
        mustard: {
          DEFAULT: "#D9A441",
          2: "#B8872E",
        },
        clay: "#8B6B4A",
        sky: "#5B8FB9",
        plum: "#7A4E7A",
        success: "#2E6B52",
        warning: "#D9A441",
        danger: "#C65D3B",
        info: "#5B8FB9",
        line: {
          DEFAULT: "#E6DFD0",
          2: "#D5CCBA",
          3: "#B8AE99",
        },
      },
      fontFamily: {
        body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Instrument Serif", "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        devanagari: ['"Noto Sans Devanagari"', "system-ui", "sans-serif"],
        tamil: ['"Noto Sans Tamil"', "system-ui", "sans-serif"],
        bengali: ['"Noto Sans Bengali"', "system-ui", "sans-serif"],
        telugu: ['"Noto Sans Telugu"', "system-ui", "sans-serif"],
        kannada: ['"Noto Sans Kannada"', "system-ui", "sans-serif"],
        gurmukhi: ['"Noto Sans Gurmukhi"', "system-ui", "sans-serif"],
        gujarati: ['"Noto Sans Gujarati"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        DEFAULT: "14px",
        md: "18px",
        lg: "24px",
        xl: "32px",
        pill: "999px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(22, 19, 15, .04)",
        sm: "0 2px 10px rgba(22, 19, 15, .05), 0 1px 2px rgba(22, 19, 15, .04)",
        DEFAULT:
          "0 10px 30px -10px rgba(22, 19, 15, .14), 0 2px 6px rgba(22, 19, 15, .04)",
        md: "0 10px 30px -10px rgba(22, 19, 15, .14), 0 2px 6px rgba(22, 19, 15, .04)",
        lg: "0 28px 60px -18px rgba(22, 19, 15, .2), 0 6px 16px rgba(22, 19, 15, .05)",
        xl: "0 48px 96px -28px rgba(22, 19, 15, .28)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(.16, 1, .3, 1)",
        ease2: "cubic-bezier(.4, 0, .2, 1)",
      },
      maxWidth: {
        app: "1280px",
        narrow: "960px",
      },
      height: {
        nav: "68px",
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ring-pulse": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "bounce-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "wave-bar": {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "slide-up": "slide-up .3s var(--ease) both",
        "ring-pulse": "ring-pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-dot": "bounce-dot 1.4s ease-in-out infinite",
        "wave-bar": "wave-bar 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
