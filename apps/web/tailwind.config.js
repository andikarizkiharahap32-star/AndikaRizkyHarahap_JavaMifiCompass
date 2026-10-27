/** @type {import('tailwindcss').Config} */
const javamifiPreset = require('../../packages/ui/src/preset');

module.exports = {
  presets: [javamifiPreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [],
};
