// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      xl: { max: '1290px' },
      lg: { max: '1024px' },
      md: { max: '768px' },
      sm: { max: '640px' }
    },
    container: {
      center: true,
      padding: '15px'
    },
    extend: {}
  },
  plugins: []
};
