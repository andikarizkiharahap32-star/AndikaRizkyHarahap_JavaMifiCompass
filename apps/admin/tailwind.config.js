/** @type {import('tailwindcss').Config} */
import javamifiPreset from '../../packages/ui/src/preset.js';

export default {
  presets: [javamifiPreset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
};
