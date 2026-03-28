import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { theme, globalCss } from '../lib/theme'

export default function TableSelectionPage() {
  const navigate = useNavigate()
  const [tableNumber, setTableNumber] = useState('')

  const goToMenu = (event) => {
    event.preventDefault()

    const parsedTable = Number.parseInt(tableNumber, 10)
    if (!Number.isInteger(parsedTable) || parsedTable <= 0) return

    navigate(`/menu?mesa=${parsedTable}`)
  }

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
          <div style={{ fontSize: 56 }}>🐸</div>
          <h1 style={{ fontFamily: 'Bebas Neue', letterSpacing: 2, fontSize: 34, marginTop: 8 }}>Bienvenido a Sapito</h1>
          <p style={{ color: theme.muted, marginTop: 8 }}>
            Ingresa el número de tu mesa para abrir el menú correcto.
          </p>

          <form onSubmit={goToMenu} style={{ marginTop: 18, display: 'grid', gap: 10 }}>
            <input
              type="number"
              min="1"
              step="1"
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              placeholder="Ej. 12"
              style={{
                width: '100%',
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: theme.surface,
                color: theme.text,
                padding: '12px 14px',
                fontSize: 16,
              }}
            />
            <button
              type="submit"
              disabled={!tableNumber}
              style={{
                padding: '11px 14px',
                borderRadius: 10,
                background: tableNumber ? theme.accent : theme.border,
                color: 'white',
                fontWeight: 700,
                cursor: tableNumber ? 'pointer' : 'not-allowed',
              }}
            >
              Ir al menú
            </button>
          </form>

          <p style={{ color: theme.muted, fontSize: 12, marginTop: 12 }}>
            Si no sabes tu número de mesa, pide ayuda al personal.
          </p>
        </div>
      </div>
    </>
  )
}
