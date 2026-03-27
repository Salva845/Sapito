// src/pages/MenuPage.jsx
// ─── Ruta: /menu?mesa=N ────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { theme, globalCss } from '../lib/theme'

const CATEGORIES = [
    'Todos', 'Entradas', 'CALDOS, COCTELES Y CEVICHES', 'ESPECIALIDADES', 'HAMBURGUESAS',
    'ALITAS, PAPAS Y MAS', 'HOT DOGS', 'PA BOTANEAR', 'SNACKS', 'CARNES', 'BURRITOS',
    'TACOS', 'ALAMBRES', 'QUESOS FUNDIDOS Y COSTRAS', 'ENSALADAS', 'CERVEZAS',
    'COCTELERIA', 'BEBIDAS SIN ALCOHOL',
]
const STATUS_LABEL = { recibido: 'Recibido', preparando: 'Preparando...', listo: '¡Listo! 🎉' }
const STATUS_COLOR = { recibido: theme.blue, preparando: theme.gold, listo: theme.green }

function useTableId() {
    return new URLSearchParams(window.location.search).get('mesa')
}

function Spinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
    )
}

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product, qty, onAdd, onRemove }) {
    return (
        <div className="fade-up" style={{ background: theme.card, borderRadius: 14, border: `1px solid ${qty > 0 ? theme.accent : theme.border}`, overflow: 'hidden', display: 'flex', transition: 'border-color .2s' }}>
            <div style={{ width: 90, minHeight: 90, flexShrink: 0, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>
                {product.photo}
            </div>
            <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>{product.name}</span>
                        <span style={{ color: theme.accent, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>${Number(product.price).toFixed(2)}</span>
                    </div>
                    <p style={{ color: theme.muted, fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>{product.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10, gap: 8 }}>
                    {qty > 0 && (
                        <>
                            <button onClick={() => onRemove(product.id)} style={{ width: 30, height: 30, borderRadius: 8, fontSize: 18, fontWeight: 700, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ fontWeight: 700, minWidth: 22, textAlign: 'center', fontSize: 15 }}>{qty}</span>
                        </>
                    )}
                    <button onClick={() => onAdd(product)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: theme.accent, color: 'white' }}>
                        {qty > 0 ? '+' : 'Agregar'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── OrderTracker ──────────────────────────────────────────────────────────────
function OrderTracker({ tableId, sessionOrderIds }) {
    const [items, setItems] = useState([])
    const fetchItems = useCallback(async () => {
        if (!sessionOrderIds.length) return
        const { data } = await supabase.from('order_items').select('id,name,photo,qty,status,order_id').in('order_id', sessionOrderIds).order('id', { ascending: true })
        if (data) setItems(data)
    }, [sessionOrderIds])

    useEffect(() => {
        fetchItems()
        const ch = supabase.channel(`tracker-${tableId}-${Date.now()}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_items' }, fetchItems)
            .subscribe()
        return () => supabase.removeChannel(ch)
    }, [fetchItems, tableId])

    if (!items.length) return null
    return (
        <div style={{ background: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 2 }}>TU PEDIDO — MESA #{tableId}</span>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: theme.card, border: `1px solid ${theme.border}` }}>
                        <span style={{ fontSize: 22 }}>{item.photo}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                            <div style={{ color: theme.muted, fontSize: 12 }}>x{item.qty}</div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: STATUS_COLOR[item.status] + '22', color: STATUS_COLOR[item.status], whiteSpace: 'nowrap' }}>
                            {STATUS_LABEL[item.status]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── BillModal ─────────────────────────────────────────────────────────────────
function BillModal({ bill, onClose }) {
    const dateStr = new Date(bill.closed_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })
    const ticketNum = String(bill.id).replace(/-/g, '').slice(-4).toUpperCase()
    return (
        <div style={{ position: 'fixed', inset: 0, background: '#000d', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div className="scale-in" style={{ width: '100%', maxWidth: 420, maxHeight: '92vh', overflow: 'auto', borderRadius: 18, background: theme.card, border: `1px solid ${theme.border}` }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: theme.accent, letterSpacing: 2 }}>TU CUENTA — MESA #{bill.table_id}</span>
                    <button onClick={onClose} style={{ padding: '5px 11px', borderRadius: 8, fontSize: 16, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}>✕</button>
                </div>
                <div style={{ padding: 18 }}>
                    <div style={{ background: '#fffef5', borderRadius: 12, border: '2px dashed #c8b97a', padding: '20px 18px', color: '#1a1a00' }}>
                        <div style={{ textAlign: 'center', marginBottom: 14, borderBottom: '1px dashed #c8b97a', paddingBottom: 12 }}>
                            <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, letterSpacing: 3 }}>SAPITO</div>
                            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>NOTA DE VENTA</div>
                            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#cc3300', marginTop: 4 }}>#{ticketNum}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12, marginBottom: 12 }}>
                            <div><span style={{ color: '#888' }}>FECHA: </span>{dateStr}</div>
                            <div><span style={{ color: '#888' }}>MESA: </span>{bill.table_id}</div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #c8b97a', fontSize: 10, color: '#888', textTransform: 'uppercase' }}>
                                    <th style={{ textAlign: 'left', paddingBottom: 5, fontWeight: 700 }}>Cant.</th>
                                    <th style={{ textAlign: 'left', paddingBottom: 5, fontWeight: 700 }}>Descripción</th>
                                    <th style={{ textAlign: 'right', paddingBottom: 5, fontWeight: 700 }}>P.U.</th>
                                    <th style={{ textAlign: 'right', paddingBottom: 5, fontWeight: 700 }}>Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(bill.bill_items || []).map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #eee8cc' }}>
                                        <td style={{ padding: '5px 0', fontWeight: 700 }}>{item.qty}</td>
                                        <td style={{ padding: '5px 6px' }}>{item.name}</td>
                                        <td style={{ padding: '5px 6px', textAlign: 'right', color: '#666' }}>{Number(item.price).toFixed(0)}</td>
                                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700 }}>{(Number(item.price) * item.qty).toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '2px solid #1a1a00' }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>TOTAL $</span>
                            <span style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#cc3300' }}>{Number(bill.total).toFixed(2)}</span>
                        </div>
                        {bill.note && <div style={{ marginTop: 8, fontSize: 11, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>{bill.note}</div>}
                        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#888', borderTop: '1px dashed #c8b97a', paddingTop: 10 }}>¡¡¡ GRACIAS POR SU VISITA !!! 🙏</div>
                    </div>
                    <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: theme.gold + '18', border: `1px solid ${theme.gold}44`, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>💵</span>
                        <span style={{ color: theme.gold, fontSize: 13, fontWeight: 600 }}>Por favor realiza tu pago con el encargado.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── SplitModal — el cliente divide la cuenta ──────────────────────────────────
// Muestra todos los items del pedido; el cliente asigna cada uno a una persona
// arrastrando o tocando el nombre de persona.
function SplitModal({ tableId, sessionOrderIds, onClose, onSend }) {
    const [allItems, setAllItems] = useState([])  // { name, price, qty, photo, remaining }
    const [numPeople, setNumPeople] = useState(2)
    const [people, setPeople] = useState([])   // [{ label, items:[{name,price,qty}] }]
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [step, setStep] = useState('people') // 'people' | 'assign'
    const [dragging, setDragging] = useState(null)  // { itemName, fromPerson } | null
    const [dragOver, setDragOver] = useState(null)

    // Cargar items de la sesión
    useEffect(() => {
        const load = async () => {
            if (!sessionOrderIds.length) { setLoading(false); return }
            const { data } = await supabase.from('order_items').select('name,price,photo,qty').in('order_id', sessionOrderIds)
            if (data) {
                // Agrupar por nombre
                const agg = {}
                data.forEach(it => {
                    if (!agg[it.name]) agg[it.name] = { name: it.name, price: Number(it.price), photo: it.photo, qty: 0 }
                    agg[it.name].qty += it.qty
                })
                setAllItems(Object.values(agg).map(it => ({ ...it, remaining: it.qty })))
            }
            setLoading(false)
        }
        load()
    }, [sessionOrderIds])

    const initPeople = () => {
        const ps = Array.from({ length: numPeople }, (_, i) => ({ label: `Persona ${i + 1}`, items: [] }))
        setPeople(ps)
        setStep('assign')
    }

    // Cuántos de un item quedan sin asignar
    const assignedQty = (itemName) =>
        people.reduce((s, p) => s + (p.items.find(i => i.name === itemName)?.qty || 0), 0)

    const remainingQty = (item) => item.qty - assignedQty(item.name)

    // Asignar 1 unidad de un item a una persona
    const assign = (itemName, personIdx) => {
        const item = allItems.find(i => i.name === itemName)
        if (!item) return
        if (remainingQty(item) <= 0) return

        setPeople(prev => prev.map((p, i) => {
            if (i !== personIdx) return p
            const ex = p.items.find(x => x.name === itemName)
            if (ex) return { ...p, items: p.items.map(x => x.name === itemName ? { ...x, qty: x.qty + 1 } : x) }
            return { ...p, items: [...p.items, { name: itemName, price: item.price, qty: 1 }] }
        }))
    }

    // Quitar 1 unidad de una persona
    const unassign = (itemName, personIdx) => {
        setPeople(prev => prev.map((p, i) => {
            if (i !== personIdx) return p
            return { ...p, items: p.items.map(x => x.name === itemName ? { ...x, qty: x.qty - 1 } : x).filter(x => x.qty > 0) }
        }))
    }

    const subtotal = (p) => p.items.reduce((s, i) => s + i.price * i.qty, 0)

    const allAssigned = allItems.every(item => remainingQty(item) === 0)

    const handleSend = async () => {
        setSending(true)
        await onSend(people, allItems)
        setSending(false)
    }

    const PERSON_COLORS = [theme.accent, theme.blue, theme.green, theme.gold, '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#84cc16']

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#000d', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div className="scale-in" style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.border}`, width: '100%', maxWidth: 520, maxHeight: '94vh', overflow: 'auto' }}>

                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: theme.accent, letterSpacing: 2 }}>DIVIDIR CUENTA — MESA #{tableId}</h2>
                        <p style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                            {step === 'people' ? 'elige cuántas personas van a dividir' : 'asigna cada producto a su persona'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 8, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 16 }}>✕</button>
                </div>

                {loading ? <div style={{ padding: 40 }}><Spinner /></div> : (
                    <div style={{ padding: 20 }}>

                        {/* PASO 1: elegir cantidad de personas */}
                        {step === 'people' && (
                            <div className="fade-in">
                                <p style={{ color: theme.muted, fontSize: 14, marginBottom: 16 }}>¿Entre cuántas personas van a dividir la cuenta?</p>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
                                    {[2, 3, 4, 5, 6, 7, 8].map(n => (
                                        <button key={n} onClick={() => setNumPeople(n)} style={{
                                            width: 60, height: 60, borderRadius: 14, fontSize: 22, fontWeight: 700,
                                            background: numPeople === n ? theme.accent : theme.surface,
                                            color: numPeople === n ? 'white' : theme.text,
                                            border: `2px solid ${numPeople === n ? theme.accent : theme.border}`,
                                        }}>{n}</button>
                                    ))}
                                </div>
                                {allItems.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: theme.muted, fontSize: 13 }}>No hay productos en tu pedido todavía.</p>
                                ) : (
                                    <button onClick={initPeople} style={{ width: '100%', padding: 14, borderRadius: 10, background: theme.accent, color: 'white', fontWeight: 700, fontSize: 15 }}>
                                        Continuar →
                                    </button>
                                )}
                            </div>
                        )}

                        {/* PASO 2: asignar items a personas */}
                        {step === 'assign' && (
                            <div className="fade-in">
                                {/* Items sin asignar */}
                                <div style={{ marginBottom: 20 }}>
                                    <p style={{ fontSize: 11, color: theme.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
                                        Productos — toca una persona para asignar
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {allItems.map(item => {
                                            const rem = remainingQty(item)
                                            return (
                                                <div key={item.name} style={{
                                                    background: rem === 0 ? theme.surface : theme.bg,
                                                    border: `1px solid ${rem === 0 ? theme.green + '55' : theme.border}`,
                                                    borderRadius: 10, padding: '10px 12px',
                                                    opacity: rem === 0 ? 0.6 : 1, transition: 'all .2s',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: rem > 0 ? 8 : 0 }}>
                                                        <span style={{ fontSize: 22 }}>{item.photo}</span>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                                                            <div style={{ color: theme.muted, fontSize: 12 }}>
                                                                {rem === 0
                                                                    ? <span style={{ color: theme.green }}>✓ Asignado</span>
                                                                    : `${rem} de ${item.qty} sin asignar`}
                                                            </div>
                                                        </div>
                                                        <span style={{ color: theme.accent, fontWeight: 700, fontSize: 14 }}>${item.price.toFixed(0)}</span>
                                                    </div>

                                                    {/* Botones de persona — solo si quedan sin asignar */}
                                                    {rem > 0 && (
                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                            {people.map((p, pi) => (
                                                                <button key={pi} onClick={() => assign(item.name, pi)} style={{
                                                                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                                    background: PERSON_COLORS[pi] + '22',
                                                                    color: PERSON_COLORS[pi],
                                                                    border: `1px solid ${PERSON_COLORS[pi]}55`,
                                                                }}>
                                                                    + {p.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Resumen por persona */}
                                <p style={{ fontSize: 11, color: theme.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
                                    Resumen por persona
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                                    {people.map((p, pi) => (
                                        <div key={pi} style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${PERSON_COLORS[pi]}33`, overflow: 'hidden' }}>
                                            <div style={{ padding: '8px 14px', background: PERSON_COLORS[pi] + '15', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: 14, color: PERSON_COLORS[pi] }}>{p.label}</span>
                                                <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: PERSON_COLORS[pi] }}>${subtotal(p).toFixed(2)}</span>
                                            </div>
                                            {p.items.length > 0 ? (
                                                <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {p.items.map((it, ii) => (
                                                        <div key={ii} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                                                            <span style={{ color: theme.text }}>{it.qty}× {it.name}</span>
                                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                <span style={{ color: theme.muted }}>${(it.price * it.qty).toFixed(0)}</span>
                                                                <button onClick={() => unassign(it.name, pi)} style={{ padding: '2px 7px', borderRadius: 6, fontSize: 11, background: theme.red + '22', color: theme.red, border: `1px solid ${theme.red}33` }}>
                                                                    −
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ padding: '8px 14px', color: theme.muted, fontSize: 12 }}>Sin productos asignados</div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {!allAssigned && (
                                    <div style={{ padding: '10px 14px', borderRadius: 10, background: '#1a0e00', border: `1px solid ${theme.gold}44`, marginBottom: 12, fontSize: 13, color: theme.gold }}>
                                        ⚠️ Aún quedan productos sin asignar
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => setStep('people')} style={{ flex: 1, padding: 12, borderRadius: 10, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontWeight: 600 }}>
                                        ← Atrás
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={sending || !allAssigned}
                                        style={{ flex: 2, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 15, background: sending || !allAssigned ? theme.border : theme.accent, color: 'white' }}
                                    >
                                        {sending ? 'Enviando...' : '📤 Solicitar división'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Main MenuPage ─────────────────────────────────────────────────────────────
export default function MenuPage() {
    const tableId = useTableId()

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('Todos')
    const [cart, setCart] = useState([])
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [sessionOrderIds, setSessionOrderIds] = useState([])

    const [accountRequested, setAccountRequested] = useState(false)
    const [requestingAccount, setRequestingAccount] = useState(false)
    const [bill, setBill] = useState(null)
    const [billNew, setBillNew] = useState(false)
    const [showBillModal, setShowBillModal] = useState(false)
    const [showAccountToast, setShowAccountToast] = useState(false)
    const [showSplitModal, setShowSplitModal] = useState(false)
    const [splitSent, setSplitSent] = useState(false)

    if (!tableId) return (
        <>
            <style>{globalCss}</style>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
                <span style={{ fontSize: 64 }}>⚠️</span>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: theme.red, letterSpacing: 2 }}>Mesa no especificada</h2>
                <p style={{ color: theme.muted }}>Escanea el código QR de tu mesa para acceder al menú.</p>
            </div>
        </>
    )

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const { data } = await supabase.from('products').select('*').eq('available', true).order('category')
            if (data) setProducts(data)
            setLoading(false)
        }
        load()
    }, [])

    // Escuchar bill
    useEffect(() => {
        if (!tableId) return
        const checkBill = async () => {
            const { data } = await supabase.from('bills').select('*, bill_items(*)').eq('table_id', parseInt(tableId)).eq('status', 'sent').order('closed_at', { ascending: false }).limit(1).maybeSingle()
            if (data) setBill(data)
        }
        checkBill()
        const fetchLatestBill = async () => {
            const { data } = await supabase.from('bills').select('*, bill_items(*)').eq('table_id', parseInt(tableId)).eq('status', 'sent').order('closed_at', { ascending: false }).limit(1).maybeSingle()
            if (data) { setBill(data); setBillNew(true); setShowBillModal(true) }
            else { setBill(null); setBillNew(false); setShowBillModal(false) }
        }
        const ch = supabase.channel(`client-bill-${tableId}-${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bills', filter: `table_id=eq.${tableId}` }, fetchLatestBill)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bills', filter: `table_id=eq.${tableId}` }, fetchLatestBill)
            .subscribe()
        return () => supabase.removeChannel(ch)
    }, [tableId])

    // Cart
    const addToCart = (product) => setCart(c => { const ex = c.find(i => i.id === product.id); return ex ? c.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...product, qty: 1 }] })
    const removeFromCart = (id) => setCart(c => c.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0))
    const cartQty = cart.reduce((s, i) => s + i.qty, 0)
    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
    const filtered = filter === 'Todos' ? products : products.filter(p => p.category === filter)

    // Enviar pedido
    const handleSubmit = async () => {
        if (!cart.length || submitting) return
        setSubmitting(true)
        try {
            const { data: order, error: oErr } = await supabase.from('orders').insert({ table_id: parseInt(tableId) }).select().single()
            if (oErr) throw oErr
            await supabase.from('order_items').insert(cart.map(i => ({ order_id: order.id, product_id: i.id, name: i.name, price: i.price, photo: i.photo, qty: i.qty, status: 'recibido' })))
            await supabase.from('tables').update({ status: 'active' }).eq('id', parseInt(tableId))
            setSessionOrderIds(prev => [...prev, order.id])
            setCart([])
            setSubmitted(true)
        } catch (e) { alert('Error al enviar pedido. Intenta de nuevo.'); console.error(e) }
        finally { setSubmitting(false) }
    }

    // Solicitar cuenta simple
    const handleRequestAccount = async () => {
        if (bill) { setBillNew(false); setShowBillModal(true); return }
        if (accountRequested) return
        if (!sessionOrderIds.length) { alert('Primero debes realizar un pedido.'); return }
        if (!window.confirm(`¿Solicitar la cuenta para la Mesa #${tableId}?`)) return
        setRequestingAccount(true)
        try {
            await supabase.from('orders').insert({ table_id: parseInt(tableId), request_account: true })
            setAccountRequested(true)
            setShowAccountToast(true)
            setTimeout(() => setShowAccountToast(false), 4000)
            setSubmitted(false)
        } catch (e) { console.error(e) }
        finally { setRequestingAccount(false) }
    }

    // Enviar solicitud de split
    const handleSendSplit = async (people, allItems) => {
        // Insertar split_request
        const { data: sr, error } = await supabase
            .from('split_requests')
            .insert({ table_id: parseInt(tableId), num_people: people.length, status: 'pending' })
            .select().single()
        if (error || !sr) { alert('Error al enviar solicitud'); return }

        // Insertar personas e items
        for (const person of people) {
            const { data: sp } = await supabase
                .from('split_people')
                .insert({ split_request_id: sr.id, label: person.label, subtotal: person.items.reduce((s, i) => s + i.price * i.qty, 0) })
                .select().single()
            if (sp && person.items.length) {
                await supabase.from('split_items').insert(person.items.map(it => ({ split_person_id: sp.id, name: it.name, price: it.price, qty: it.qty })))
            }
        }

        // Insertar orden con request_account para notificar a cocina
        await supabase.from('orders').insert({ table_id: parseInt(tableId), request_account: true })

        setShowSplitModal(false)
        setSplitSent(true)
        setShowAccountToast(true)
        setTimeout(() => setShowAccountToast(false), 4000)
        setSubmitted(false)
    }

    // ── Pantalla: pedido enviado ───────────────────────────────────────────────
    if (submitted) return (
        <>
            <style>{globalCss}</style>
            <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '24px 16px' }}>
                <div style={{ fontSize: 72 }}>✅</div>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 38, color: theme.accent, letterSpacing: 3 }}>¡PEDIDO ENVIADO!</h2>
                <p style={{ color: theme.muted, textAlign: 'center', lineHeight: 1.6 }}>Tu pedido está en camino a la cocina.<br />Mesa #{tableId}</p>
                <div style={{ width: '100%', maxWidth: 440 }}>
                    <OrderTracker tableId={tableId} sessionOrderIds={sessionOrderIds} />
                </div>
                <button onClick={() => setSubmitted(false)} style={{ padding: '10px 22px', borderRadius: 10, background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, fontWeight: 600 }}>
                    ← Agregar más
                </button>
            </div>
        </>
    )

    // ── Vista principal ───────────────────────────────────────────────────────
    return (
        <>
            <style>{globalCss}</style>

            {showAccountToast && (
                <div className="scale-in" style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: theme.card, border: `1px solid ${theme.gold}`, borderRadius: 14, padding: '14px 20px', maxWidth: 340, width: '90%', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px #0008' }}>
                    <span style={{ fontSize: 28 }}>{splitSent ? '✂️' : '⏳'}</span>
                    <div>
                        <div style={{ fontWeight: 700, color: theme.gold, fontSize: 14 }}>{splitSent ? 'División solicitada' : 'Cuenta solicitada'}</div>
                        <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{splitSent ? 'El encargado verá tu división y cobrará a cada persona.' : 'Pronto recibirás tu nota de venta aquí.'}</div>
                    </div>
                </div>
            )}

            {showBillModal && bill && <BillModal bill={bill} onClose={() => { setShowBillModal(false); setBillNew(false) }} />}
            {showSplitModal && <SplitModal tableId={tableId} sessionOrderIds={sessionOrderIds} onClose={() => setShowSplitModal(false)} onSend={handleSendSplit} />}

            <div style={{ background: theme.bg, minHeight: '100vh' }}>

                {/* Header sticky */}
                <div style={{ position: 'sticky', top: 0, zIndex: 20, background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: theme.accent, letterSpacing: 3, lineHeight: 1 }}>SAPITO</h1>
                            <p style={{ color: theme.muted, fontSize: 12 }}>Mesa #{tableId}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                            {/* Botón dividir cuenta */}
                            {sessionOrderIds.length > 0 && !bill && (
                                <button
                                    onClick={() => setShowSplitModal(true)}
                                    disabled={splitSent}
                                    style={{
                                        padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                        background: splitSent ? theme.green + '22' : theme.blue + '22',
                                        color: splitSent ? theme.green : theme.blue,
                                        border: `1px solid ${splitSent ? theme.green + '77' : theme.blue + '55'}`,
                                        whiteSpace: 'nowrap', opacity: splitSent ? 0.7 : 1,
                                    }}
                                >
                                    {splitSent ? '✂️ Dividida' : '✂️ Dividir'}
                                </button>
                            )}

                            {/* Botón cuenta */}
                            {(sessionOrderIds.length > 0 || accountRequested || bill) && !splitSent && (
                                <button
                                    onClick={handleRequestAccount}
                                    disabled={requestingAccount}
                                    style={{
                                        position: 'relative', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                        background: bill ? theme.green + '22' : accountRequested ? theme.gold + '12' : theme.gold + '18',
                                        color: bill ? theme.green : theme.gold,
                                        border: `1px solid ${bill ? theme.green + '77' : theme.gold + '55'}`,
                                        whiteSpace: 'nowrap', opacity: requestingAccount ? 0.6 : 1,
                                    }}
                                >
                                    {bill ? '🧾 Ver cuenta' : accountRequested ? '⏳ Solicitada' : '🧾 Cuenta'}
                                    {billNew && <span style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', background: theme.green, animation: 'pulse 1s infinite', border: `2px solid ${theme.surface}` }} />}
                                </button>
                            )}

                            {cartQty > 0 && (
                                <div style={{ background: theme.accentDim, border: `1px solid ${theme.accent}`, borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 16 }}>🛒</span>
                                    <span style={{ color: theme.accent, fontWeight: 700 }}>{cartQty}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setFilter(cat)} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', background: filter === cat ? theme.accent : theme.card, color: filter === cat ? 'white' : theme.muted, border: `1px solid ${filter === cat ? theme.accent : theme.border}` }}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tracker inline */}
                {sessionOrderIds.length > 0 && (
                    <div style={{ padding: '16px 16px 0' }}>
                        <OrderTracker tableId={tableId} sessionOrderIds={sessionOrderIds} />
                    </div>
                )}

                {/* Banner: cuenta solicitada */}
                {accountRequested && !bill && !splitSent && (
                    <div style={{ margin: '16px 16px 0', background: '#1a1200', border: `1px solid ${theme.gold}44`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>⏳</span>
                        <div>
                            <div style={{ color: theme.gold, fontWeight: 600, fontSize: 13 }}>Cuenta solicitada</div>
                            <div style={{ color: theme.muted, fontSize: 11, marginTop: 2 }}>El encargado está preparando tu cuenta.</div>
                        </div>
                    </div>
                )}

                {/* Banner: división solicitada */}
                {splitSent && !bill && (
                    <div style={{ margin: '16px 16px 0', background: '#001a1a', border: `1px solid ${theme.blue}55`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>✂️</span>
                        <div>
                            <div style={{ color: theme.blue, fontWeight: 600, fontSize: 13 }}>División de cuenta solicitada</div>
                            <div style={{ color: theme.muted, fontSize: 11, marginTop: 2 }}>El encargado cobrará a cada persona por separado.</div>
                        </div>
                    </div>
                )}

                {/* Banner: cuenta lista */}
                {bill && (
                    <div className="scale-in" onClick={() => { setShowBillModal(true); setBillNew(false) }} style={{ margin: '16px 16px 0', background: '#0d2200', border: `1px solid ${theme.green}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <span style={{ fontSize: 22 }}>🧾</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: theme.green, fontWeight: 700, fontSize: 14 }}>¡Tu cuenta está lista!</div>
                            <div style={{ color: theme.muted, fontSize: 11, marginTop: 2 }}>Toca aquí · Total: ${Number(bill.total).toFixed(2)}</div>
                        </div>
                        <span style={{ color: theme.green, fontSize: 18 }}>›</span>
                    </div>
                )}

                {/* Productos */}
                <div style={{ padding: `16px 16px ${cart.length ? 180 : 32}px` }}>
                    {loading ? <Spinner /> : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {filtered.map((p, i) => {
                                const qty = cart.find(c => c.id === p.id)?.qty || 0
                                return (
                                    <div key={p.id} style={{ animationDelay: `${i * 0.04}s` }}>
                                        <ProductCard product={p} qty={qty} onAdd={addToCart} onRemove={removeFromCart} />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer carrito */}
                {cart.length > 0 && (
                    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: theme.surface, borderTop: `1px solid ${theme.border}`, padding: 16, zIndex: 30 }}>
                        <div style={{ maxWidth: 520, margin: '0 auto' }}>
                            {bill && (
                                <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: theme.gold + '18', border: `1px solid ${theme.gold}44`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>⚠️</span>
                                    <span style={{ color: theme.gold, fontSize: 12, fontWeight: 600 }}>Tu cuenta ya fue enviada. El encargado actualizará el total.</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {cart.map(i => <span key={i.id} style={{ fontSize: 12, color: theme.muted }}>{i.qty}× {i.name}</span>)}
                                </div>
                                <span style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: theme.accent }}>${cartTotal.toFixed(2)}</span>
                            </div>
                            <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: 14, borderRadius: 10, fontSize: 16, fontWeight: 700, letterSpacing: 1, background: submitting ? theme.border : theme.accent, color: 'white' }}>
                                {submitting ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}