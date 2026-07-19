module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        mint: '#00D084',
        'mint-dim': '#00A468',
        loss: '#FF4D4D',
        'loss-dim': '#B03434',
        ink: '#000000',
        surface: '#0A0A0A',
        divider: 'rgba(255,255,255,0.08)',
        muted: '#8E8E93',
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
    },
  },
  plugins: [],
};
