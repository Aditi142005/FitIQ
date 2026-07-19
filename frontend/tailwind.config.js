/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#C65D3B",
        background: "#FAF7F2",
        surface: "#FFFFFF",
        textPrimary: "#2B2B2B",
        textSecondary: "#6B7280",
        success: "#3D8B5C",
        error: "#DC2626",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  plugins: [],
};