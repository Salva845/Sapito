import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { theme, globalCss } from '../lib/theme'

export default function TableSelectionPage() {
  const navigate = useNavigate()
  const [tableNumber, setTableNumber] = useState('')
  const [checkingTable, setCheckingTable] = useState(false)
  const [error, setError] = useState('')

  const goToMenu = async (event) => {
    event.preventDefault()

    const parsedTable = Number.parseInt(tableNumber, 10)
    if (!Number.isInteger(parsedTable) || parsedTable <= 0) {
      setError('Ingresa un número de mesa válido.')
      return
    }

    setCheckingTable(true)
    setError('')

    const { data, error: queryError } = await supabase
      .from('tables')
      .select('id')
      .eq('id', parsedTable)
      .maybeSingle()

    setCheckingTable(false)

    if (queryError) {
      setError('No pudimos validar la mesa. Intenta nuevamente.')
      return
    }

    if (!data) {
      setError(`La mesa #${parsedTable} no existe. Verifica el número con el personal.`)
      return
    }

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
              onChange={(event) => {
                setTableNumber(event.target.value)
                if (error) setError('')
              }}
              placeholder="Ej. 12"
              style={{
                width: '100%',
                borderRadius: 10,
                border: `1px solid ${error ? theme.red : theme.border}`,
                background: theme.surface,
                color: theme.text,
                padding: '12px 14px',
                fontSize: 16,
              }}
            />
            <button
              type="submit"
              disabled={!tableNumber || checkingTable}
              style={{
                padding: '11px 14px',
                borderRadius: 10,
                background: (!tableNumber || checkingTable) ? theme.border : theme.accent,
                color: 'white',
                fontWeight: 700,
                cursor: (!tableNumber || checkingTable) ? 'not-allowed' : 'pointer',
              }}
            >
              {checkingTable ? 'Validando mesa...' : 'Ir al menú'}
            </button>
          </form>

          {error && (
            <p style={{ color: theme.red, fontSize: 13, marginTop: 10 }}>
              {error}
            </p>
          )}

          <p style={{ color: theme.muted, fontSize: 12, marginTop: 12 }}>
            Si no sabes tu número de mesa, pide ayuda al personal.
          </p>
        </div>
      </div>
    </>
  )
}
