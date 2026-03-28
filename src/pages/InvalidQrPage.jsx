import { theme, globalCss } from '../lib/theme'

export default function InvalidQrPage() {
  return (
    <>
      <style>{globalCss}</style>
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        color: theme.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div className="fade-up" style={{
          width: '100%',
          maxWidth: 420,
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 56 }}>⚠️</div>
          <h1 style={{ fontFamily: 'Bebas Neue', letterSpacing: 2, fontSize: 34, marginTop: 8 }}>
            URL no válida
          </h1>
          <p style={{ color: theme.muted, marginTop: 8 }}>
            Por favor escanea el código QR de tu mesa para entrar al menú correcto.
          </p>
        </div>
      </div>
    </>
  )
}
