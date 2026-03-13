// src/lib/theme.js
export const theme = {
    bg: '#0c0c10',
    surface: '#14141c',
    card: '#1c1c28',
    border: '#2c2c40',
    accent: '#ff6b2b',
    accentDim: '#ff6b2b1a',
    gold: '#f5c842',
    green: '#22c55e',
    blue: '#3b82f6',
    red: '#ef4444',
    text: '#f0f0f6',
    muted: '#7878a0',
}

export const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,600;1,9..40,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body {
    background: ${theme.bg};
    color: ${theme.text};
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${theme.surface}; }
  ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes spin     { to { transform: rotate(360deg); } }

  .fade-up  { animation: fadeUp  .35s ease both; }
  .fade-in  { animation: fadeIn  .25s ease both; }
  .scale-in { animation: scaleIn .3s  ease both; }

  button { cursor: pointer; font-family: inherit; border: none; outline: none; transition: all .18s; }
  button:active { transform: scale(.97); }
  input, textarea, select {
    font-family: inherit;
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    color: ${theme.text};
    border-radius: 8px;
    outline: none;
    transition: border-color .2s;
  }
  input:focus, textarea:focus, select:focus { border-color: ${theme.accent}; }
  select option { background: ${theme.surface}; }
`