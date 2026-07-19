module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        // Light theme — Trade Republic web app.
        ink: '#000000',
        canvas: '#FFFFFF',
        surface: '#F5F5F7',
        'surface-2': '#EFEFF3',
        muted: '#6E6E73',
        'muted-2': '#A1A1A6',
        hairline: 'rgba(0,0,0,0.08)',
        mint: '#00D084',
        'mint-deep': '#00A468',
        loss: '#E23A3A',
        'loss-deep': '#B12525',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Segoe UI Variable',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '16px',
      },
      maxWidth: {
        shell: '1440px',
      },
    },
  },
  plugins: [],
};
