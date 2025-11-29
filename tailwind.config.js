// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,svelte,js,ts}", // Pastikan ini sesuai dengan struktur proyek Anda
  ],
  theme: {
    extend: {
      colors: {
        myPrimary: "#002962", // Warna utama
        secondary: "#EFEFEF", // Warna sekunder
        third: "#FFFFFF", // Warna ketiga
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Font default
        heading: ["Roboto", "sans-serif"], // Font untuk heading
      },
    },
  },
  plugins: [],
};
