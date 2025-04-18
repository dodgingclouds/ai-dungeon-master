/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 VERY important to include all component files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
