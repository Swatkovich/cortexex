/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx}',      
      './components/**/*.{js,ts,jsx,tsx}' 
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            white: '#F9F9DF',
            dark: '#1A1A1A'
          }
        },
      },
    },
    variants: {},
    plugins: [],
  };