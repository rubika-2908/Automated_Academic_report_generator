/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e7ff",
          200: "#b3ceff",
          300: "#8cb5ff",
          400: "#5d90ff",
          500: "#3b7dff",
          600: "#2f63db",
          700: "#264fb0",
          800: "#203f86",
          900: "#1a2e5f",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 35, 75, 0.12)",
      },
    },
  },
  plugins: [],
};
