module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        // Trade Republic light theme
        ink: '#0A0A0A',
        canvas: '#FFFFFF',
        surface: '#F5F5F7',
        'surface-2': '#EFEFF3',
        muted: '#6B6B6B',
        'muted-2': '#A1A1A6',
        hairline: 'rgba(0,0,0,0.09)',
        mint: '#00D084',
        'mint-deep': '#00A468',
        'mint-light': 'rgba(0, 208, 132, 0.12)',
        loss: '#E23A3A',
        'loss-deep': '#B12525',
        'loss-light': 'rgba(226, 58, 58, 0.12)',
      },
      fontFamily: {
        sans: [
          'Inter',
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
        pill: '999px',
      },
      maxWidth: {
        shell: '1440px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
};
