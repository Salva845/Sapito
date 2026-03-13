// src/pages/GenerateQRs.jsx
// ─── Instala: npm install qrcode.react ────────────────────────────────────────
import { QRCodeSVG } from 'qrcode.react'
import { theme, globalCss } from '../lib/theme'

const TABLES = [1, 2, 3, 4, 5, 6]

/**
 * Cada QR apunta a:
 *   https://TU_DOMINIO/menu?mesa=N
 *
 * Al escanear, React Router (o window.location.search) extrae el parámetro
 * `mesa` y se lo pasa al componente MenuPage como tableId.
 *
 * Cambia BASE_URL por tu dominio real o localhost durante desarrollo.
 */
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5173'

export default function GenerateQRs() {
    const handlePrint = () => window.print()

    return (
        <>
            <style>{globalCss}</style>
            <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .qr-card { border: 1px solid #ccc !important; background: white !important; }
          .qr-label { color: black !important; }
        }
      `}</style>

            <div style={{ background: theme.bg, minHeight: '100vh', padding: 32 }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                        <div>
                            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 42, color: theme.accent, letterSpacing: 3, lineHeight: 1 }}>
                                CÓDIGOS QR
                            </h1>
                            <p style={{ color: theme.muted, marginTop: 4 }}>
                                Imprime y coloca uno en cada mesa
                            </p>
                        </div>
                        <button
                            className="no-print"
                            onClick={handlePrint}
                            style={{
                                padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                                background: theme.accent, color: 'white',
                            }}
                        >
                            🖨️ Imprimir
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
                        {TABLES.map(tableNum => {
                            const url = `${BASE_URL}/menu?mesa=${tableNum}`
                            return (
                                <div
                                    key={tableNum}
                                    className="qr-card fade-up"
                                    style={{
                                        background: theme.card,
                                        borderRadius: 16,
                                        border: `1px solid ${theme.border}`,
                                        padding: 24,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 16,
                                        animationDelay: `${tableNum * 0.07}s`,
                                    }}
                                >
                                    <p style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 3, color: theme.accent }} className="qr-label">
                                        MESA {tableNum}
                                    </p>

                                    {/* QR blanco para mejor escaneo en impresión */}
                                    <div style={{ background: 'white', padding: 12, borderRadius: 10 }}>
                                        <QRCodeSVG
                                            value={url}
                                            size={160}
                                            bgColor="#ffffff"
                                            fgColor="#0c0c10"
                                            level="M"
                                        />
                                    </div>

                                    <p style={{ color: theme.muted, fontSize: 11, textAlign: 'center', wordBreak: 'break-all' }}>
                                        {url}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}