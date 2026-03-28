// src/pages/MenuPage.jsx
// ─── Ruta: /menu?mesa=N ────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { theme, globalCss } from '../lib/theme'

const CATEGORIES = ['Todos', 'Entradas', 'CALDOS, COCTELES Y CEVICHES', 'ESPECIALIDADES', 'HAMBURGUESAS', 'ALITAS, PAPAS Y MAS',
    'HOT DOGS', 'PA BOTANEAR', 'SNACKS', 'CARNES', 'BURRITOS', 'TACOS', 'ALAMBRES', 'QUESOS FUNDIDOS Y COSTRAS',
    'ENSALADAS', 'CERVEZAS', 'COCTELERIA', 'BEBIDAS SIN ALCOHOL']
const STATUS_LABEL = { recibido: 'Recibido', preparando: 'Preparando...', listo: '¡Listo! 🎉' }
const STATUS_COLOR = { recibido: theme.blue, preparando: theme.gold, listo: theme.green }

/** true si el campo photo es una URL de imagen (no emoji) */
function isUrl(str) {
    return typeof str === 'string' && (str.startsWith('http') || str.startsWith('/'))
}

function useTableId() {
    const params = new URLSearchParams(window.location.search)
    const tableIdParam = params.get('mesa')
    const hasQueryParams = Array.from(params.keys()).length > 0

    if (!tableIdParam) {
        return { tableId: null, tableNum: null, isValid: false, hasQueryParams }
    }

    const normalizedTableId = tableIdParam.trim()
    if (!/^\d+$/.test(normalizedTableId)) {
        return { tableId: normalizedTableId, tableNum: null, isValid: false, hasQueryParams }
    }

    const tableNum = Number.parseInt(normalizedTableId, 10)
    if (!Number.isInteger(tableNum) || tableNum <= 0) {
        return { tableId: normalizedTableId, tableNum: null, isValid: false, hasQueryParams }
    }

    return { tableId: normalizedTableId, tableNum, isValid: true, hasQueryParams }
}

function normalizeFlavors(value) {
    if (Array.isArray(value)) {
        return value.map(v => String(v).trim()).filter(Boolean)
    }
    if (typeof value === 'string') {
        return value.split(',').map(v => v.trim()).filter(Boolean)
    }
    return []
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{
                width: 32, height: 32,
                border: `3px solid ${theme.border}`,
                borderTopColor: theme.accent,
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
            }} />
        </div>
    )
}

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product, cartItems, onAdd, onRemove }) {
    const flavors = normalizeFlavors(product.flavors)
    const [selectedFlavor, setSelectedFlavor] = useState(flavors[0] || '')
    const qty = cartItems.find(i => i.id === product.id && (i.selectedFlavor || '') === (selectedFlavor || ''))?.qty || 0

    return (
        <div className="fade-up" style={{
            background: theme.card, borderRadius: 14,
            border: `1px solid ${qty > 0 ? theme.accent : theme.border}`,
            overflow: 'hidden', display: 'flex', transition: 'border-color .2s',
        }}>
            <div style={{
                width: 90, minHeight: 90, flexShrink: 0,
                background: theme.surface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 38, overflow: 'hidden',
            }}>
                {isUrl(product.photo)
                    ? <img src={product.photo} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : product.photo
                }
            </div>
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>{product.name}</span>
                        <span style={{ color: theme.accent, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                            ${Number(product.price).toFixed(2)}
                        </span>
                    </div>
                    <p style={{ color: theme.muted, fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>
                        {product.description}
                    </p>
                    {flavors.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                            <label style={{ display: 'block', color: theme.muted, fontSize: 11, marginBottom: 4 }}>
                                Sabor
                            </label>
                            <select
                                value={selectedFlavor}
                                onChange={(e) => setSelectedFlavor(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '7px 9px',
                                    borderRadius: 8,
                                    background: theme.surface,
                                    border: `1px solid ${theme.border}`,
                                    color: theme.text,
                                    fontSize: 12,
                                }}
                            >
                                {flavors.map(flavor => (
                                    <option key={flavor} value={flavor}>{flavor}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10, gap: 8 }}>
                    {qty > 0 && (
                        <>
                            <button onClick={() => onRemove(product.id, selectedFlavor)} style={{
                                width: 30, height: 30, borderRadius: 8, fontSize: 18, fontWeight: 700,
                                background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>−</button>
                            <span style={{ fontWeight: 700, minWidth: 22, textAlign: 'center', fontSize: 15 }}>{qty}</span>
                        </>
                    )}
                    <button onClick={() => onAdd(product, selectedFlavor)} style={{
                        padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        background: theme.accent, color: 'white',
                    }}>
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
        if (!sessionOrderIds.length) {
            setItems([])
            return
        }
        const { data } = await supabase
            .from('order_items')
            .select('id, name, photo, qty, status, order_id')
            .in('order_id', sessionOrderIds)
            .order('id', { ascending: true })
        if (data) setItems(data)
    }, [sessionOrderIds])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchItems()
        const channel = supabase
            .channel(`tracker-${tableId}-${Date.now()}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_items' }, fetchItems)
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [fetchItems, tableId])

    if (!items.length) return null

    return (
        <div style={{
            background: theme.surface, borderRadius: 14,
            border: `1px solid ${theme.border}`, overflow: 'hidden',
        }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 2, color: theme.text }}>
                    TU PEDIDO — MESA #{tableId}
                </span>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(item => (
                    <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 8,
                        background: theme.card, border: `1px solid ${theme.border}`,
                    }}>
                        <span style={{ fontSize: 22, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', borderRadius: 6 }}>
                            {isUrl(item.photo)
                                ? <img src={item.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : item.photo
                            }
                        </span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                            <div style={{ color: theme.muted, fontSize: 12 }}>x{item.qty}</div>
                        </div>
                        <span style={{
                            padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                            background: STATUS_COLOR[item.status] + '22',
                            color: STATUS_COLOR[item.status], whiteSpace: 'nowrap',
                        }}>
                            {STATUS_LABEL[item.status]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── BillModal — nota de venta que le llega al cliente ─────────────────────────
function BillModal({ bill, onClose }) {
    const dateStr = new Date(bill.closed_at).toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: '2-digit',
    })
    const ticketNum = String(bill.id).replace(/-/g, '').slice(-4).toUpperCase()

    return (
        <div style={{
            position: 'fixed', inset: 0, background: '#000d', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
            <div className="scale-in" style={{
                width: '100%', maxWidth: 420, maxHeight: '92vh', overflow: 'auto',
                borderRadius: 18, background: theme.card, border: `1px solid ${theme.border}`,
            }}>
                {/* Header del modal */}
                <div style={{
                    padding: '14px 18px', borderBottom: `1px solid ${theme.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: theme.accent, letterSpacing: 2 }}>
                        TU CUENTA — MESA #{bill.table_id}
                    </span>
                    <button onClick={onClose} style={{
                        padding: '5px 11px', borderRadius: 8, fontSize: 16,
                        background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted,
                    }}>✕</button>
                </div>

                <div style={{ padding: 18 }}>
                    {/* Ticket */}
                    <div style={{
                        background: '#fffef5', borderRadius: 12,
                        border: '2px dashed #c8b97a',
                        padding: '20px 18px', color: '#1a1a00',
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: 14, borderBottom: '1px dashed #c8b97a', paddingBottom: 12 }}>
                            <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, letterSpacing: 3 }}>SAPITO</div>
                            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>NOTA DE VENTA</div>
                            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#cc3300', marginTop: 4 }}>
                                #{ticketNum}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12, color: '#333', marginBottom: 12 }}>
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
                                        <td style={{ padding: '5px 6px', textAlign: 'right', color: '#666' }}>
                                            {Number(item.price).toFixed(0)}
                                        </td>
                                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700 }}>
                                            {(Number(item.price) * item.qty).toFixed(0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginTop: 12, paddingTop: 10, borderTop: '2px solid #1a1a00',
                        }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>TOTAL $</span>
                            <span style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#cc3300' }}>
                                {Number(bill.total).toFixed(2)}
                            </span>
                        </div>
                        {bill.note && (
                            <div style={{ marginTop: 8, fontSize: 11, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
                                {bill.note}
                            </div>
                        )}
                        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#888', borderTop: '1px dashed #c8b97a', paddingTop: 10 }}>
                            ¡¡¡ GRACIAS POR SU VISITA !!! 🙏
                        </div>
                    </div>

                    {/* Instrucción de pago */}
                    <div style={{
                        marginTop: 14, padding: '12px 14px', borderRadius: 10,
                        background: theme.gold + '18', border: `1px solid ${theme.gold}44`,
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{ fontSize: 22 }}>💵</span>
                        <span style={{ color: theme.gold, fontSize: 13, fontWeight: 600 }}>
                            Por favor realiza tu pago con el encargado.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Main MenuPage ─────────────────────────────────────────────────────────────
export default function MenuPage() {
    const { tableId, tableNum, isValid: hasValidTableId, hasQueryParams } = useTableId()

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('Todos')
    const [cart, setCart] = useState([])
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [sessionOrderIds, setSessionOrderIds] = useState([])

    // cuenta
    const [accountRequested, setAccountRequested] = useState(false)
    const [requestingAccount, setRequestingAccount] = useState(false)
    const [bill, setBill] = useState(null)           // bill con status='sent'
    const [billNew, setBillNew] = useState(false)    // para el pulso de notificación
    const [showBillModal, setShowBillModal] = useState(false)
    const [showAccountToast, setShowAccountToast] = useState(false) // toast al solicitar
    const [tableExists, setTableExists] = useState(null)

    const resetClientOrderFlow = useCallback(() => {
        setSessionOrderIds([])
        setAccountRequested(false)
        setSubmitted(false)
        setBill(null)
        setBillNew(false)
        setShowBillModal(false)
        setShowAccountToast(false)
    }, [])

    // ── Cargar productos ──────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const { data } = await supabase
                .from('products').select('*').eq('available', true).order('category')
            if (data) setProducts(data)
            setLoading(false)
        }
        load()
    }, [])

    // ── Validar mesa existente en BD ──────────────────────────────────────────
    useEffect(() => {
        if (!hasValidTableId) {
            setTableExists(null)
            return
        }

        let isMounted = true
        const validateTable = async () => {
            setTableExists(null)
            const { data, error } = await supabase
                .from('tables')
                .select('id, status')
                .eq('id', tableNum)
                .maybeSingle()

            if (!isMounted) return
            const enabled = !error && Boolean(data) && data.status !== 'disabled'
            setTableExists(enabled)
        }

        validateTable()
        return () => { isMounted = false }
    }, [hasValidTableId, tableNum])

    // ── Escuchar bill en tiempo real ──────────────────────────────────────────
    useEffect(() => {
        if (!hasValidTableId || !tableExists) return

        // Revisar si ya existe un bill enviado al montar (por si el cliente recarga)
        const checkBill = async () => {
            const { data } = await supabase
                .from('bills')
                .select('*, bill_items(*)')
                .eq('table_id', tableNum)
                .eq('status', 'sent')
                .order('closed_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            if (data) setBill(data)
        }
        checkBill()

        // Escuchar nueva cuenta o reenvío en tiempo real
        const fetchLatestBill = async () => {
            const { data } = await supabase
                .from('bills')
                .select('*, bill_items(*)')
                .eq('table_id', tableNum)
                .eq('status', 'sent')
                .order('closed_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            if (data) {
                setBill(data)
                setBillNew(true)
                setShowBillModal(true)
            } else {
                // Bill fue reemplazado/pagado — limpiar
                setBill(null)
                setBillNew(false)
                setShowBillModal(false)
            }
        }

        const channel = supabase
            .channel(`client-bill-${tableId}-${Date.now()}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'bills',
                filter: `table_id=eq.${tableId}`,
            }, fetchLatestBill)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'bills',
                filter: `table_id=eq.${tableId}`,
            }, fetchLatestBill)
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [hasValidTableId, tableExists, tableId, tableNum])

    // ── Limpiar UI del cliente cuando la mesa fue liberada tras pago ─────────
    useEffect(() => {
        if (!hasValidTableId || !tableExists) return

        const syncTableState = async () => {
            const [{ data: table }, { data: openOrders }, { data: sentBill }] = await Promise.all([
                supabase.from('tables').select('status').eq('id', tableNum).maybeSingle(),
                supabase.from('orders').select('id').eq('table_id', tableNum).eq('closed', false).limit(1),
                supabase.from('bills').select('id').eq('table_id', tableNum).eq('status', 'sent').limit(1),
            ])

            const isFree = table?.status === 'free'
            const hasOpenOrders = (openOrders || []).length > 0
            const hasSentBill = (sentBill || []).length > 0

            // Mesa libre + sin pedidos abiertos + sin cuenta enviada => flujo terminado/pagado
            if (isFree && !hasOpenOrders && !hasSentBill) {
                resetClientOrderFlow()
            }
        }

        syncTableState()

        const channel = supabase
            .channel(`client-table-sync-${tableId}-${Date.now()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `id=eq.${tableId}` }, syncTableState)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, syncTableState)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `table_id=eq.${tableId}` }, syncTableState)
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [hasValidTableId, tableExists, tableId, tableNum, resetClientOrderFlow])

    // ── Cart ──────────────────────────────────────────────────────────────────
    const addToCart = (product, flavor = '') => setCart(c => {
        const ex = c.find(i => i.id === product.id && (i.selectedFlavor || '') === (flavor || ''))
        return ex
            ? c.map(i => i.id === product.id && (i.selectedFlavor || '') === (flavor || '') ? { ...i, qty: i.qty + 1 } : i)
            : [...c, { ...product, selectedFlavor: flavor || '', qty: 1 }]
    })
    const removeFromCart = (id, flavor = '') => setCart(c =>
        c
            .map(i => i.id === id && (i.selectedFlavor || '') === (flavor || '') ? { ...i, qty: i.qty - 1 } : i)
            .filter(i => i.qty > 0)
    )
    const cartQty = cart.reduce((s, i) => s + i.qty, 0)
    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
    const filtered = filter === 'Todos' ? products : products.filter(p => p.category === filter)

    // ── Enviar pedido ─────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!cart.length || submitting || !tableExists) return
        setSubmitting(true)
        try {
            const { data: order, error: oErr } = await supabase
                .from('orders')
                .insert({ table_id: tableNum })
                .select()
                .single()
            if (oErr) throw oErr

            await supabase.from('order_items').insert(
                cart.map(i => ({
                    order_id: order.id, product_id: i.id,
                    name: i.selectedFlavor ? `${i.name} (${i.selectedFlavor})` : i.name,
                    price: i.price, photo: i.photo,
                    qty: i.qty, status: 'recibido',
                }))
            )
            await supabase.from('tables').update({ status: 'active' }).eq('id', tableNum)

            setSessionOrderIds(prev => [...prev, order.id])
            setCart([])
            setSubmitted(true)
        } catch (e) {
            alert('Error al enviar pedido. Intenta de nuevo.')
            console.error(e)
        } finally {
            setSubmitting(false)
        }
    }

    // ── Solicitar cuenta ──────────────────────────────────────────────────────
    const handleRequestAccount = async () => {
        if (!tableExists) return
        if (bill) {
            // Ya llegó la cuenta → abrir modal
            setBillNew(false)
            setShowBillModal(true)
            return
        }
        if (accountRequested) return // ya solicitada, no hacer nada

        if (!sessionOrderIds.length) {
            alert('Primero debes realizar un pedido.')
            return
        }
        if (!window.confirm(`¿Solicitar la cuenta para la Mesa #${tableId}?`)) return

        setRequestingAccount(true)
        try {
            await supabase
                .from('orders')
                .insert({ table_id: tableNum, request_account: true })
            setAccountRequested(true)
            // Mostrar toast temporal y regresar al menú
            setShowAccountToast(true)
            setTimeout(() => setShowAccountToast(false), 4000)
            // Si está en la pantalla de "pedido enviado", regresa al menú
            setSubmitted(false)
        } catch (e) {
            console.error(e)
        } finally {
            setRequestingAccount(false)
        }
    }

    // ── Redirección a página pública informativa cuando la URL no es válida ─
    if (!tableId) {
        return <Navigate to="/inicio" replace state={{ source: hasQueryParams ? 'invalid-query' : 'missing-table' }} />
    }

    if (!hasValidTableId) {
        return <Navigate to="/inicio" replace state={{ source: 'invalid-table-id' }} />
    }

    if (tableExists === null) {
        return (
            <>
                <style>{globalCss}</style>
                <Spinner />
            </>
        )
    }

    if (!tableExists) {
        return <Navigate to="/inicio" replace state={{ source: 'table-not-found' }} />
    }

    // ── Pantalla: pedido enviado ──────────────────────────────────────────────
    if (submitted) return (
        <>
            <style>{globalCss}</style>
            <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '24px 16px' }}>
                <div style={{ fontSize: 72 }}>✅</div>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 38, color: theme.accent, letterSpacing: 3 }}>¡PEDIDO ENVIADO!</h2>
                <p style={{ color: theme.muted, textAlign: 'center', lineHeight: 1.6 }}>
                    Tu pedido está en camino a la cocina.<br />Mesa #{tableId}
                </p>
                <div style={{ width: '100%', maxWidth: 440 }}>
                    <OrderTracker tableId={tableId} sessionOrderIds={sessionOrderIds} />
                </div>
                <button
                    onClick={() => setSubmitted(false)}
                    style={{
                        padding: '10px 22px', borderRadius: 10,
                        background: theme.card, border: `1px solid ${theme.border}`,
                        color: theme.text, fontWeight: 600,
                    }}
                >
                    ← Agregar más
                </button>
            </div>
        </>
    )

    // ── Vista principal del menú ──────────────────────────────────────────────
    return (
        <>
            <style>{globalCss}</style>

            {/* Toast: cuenta solicitada */}
            {showAccountToast && (
                <div className="scale-in" style={{
                    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 200, background: theme.card, border: `1px solid ${theme.gold}`,
                    borderRadius: 14, padding: '14px 20px', maxWidth: 340, width: '90%',
                    display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px #0008',
                }}>
                    <span style={{ fontSize: 28 }}>⏳</span>
                    <div>
                        <div style={{ fontWeight: 700, color: theme.gold, fontSize: 14 }}>Cuenta solicitada</div>
                        <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                            Pronto recibirás tu nota de venta aquí.
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de nota de venta */}
            {showBillModal && bill && (
                <BillModal bill={bill} onClose={() => { setShowBillModal(false); setBillNew(false) }} />
            )}

            <div style={{ background: theme.bg, minHeight: '100vh' }}>

                {/* Header sticky */}
                <div style={{
                    position: 'sticky', top: 0, zIndex: 20,
                    background: theme.surface, borderBottom: `1px solid ${theme.border}`,
                    padding: '14px 18px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: theme.accent, letterSpacing: 3, lineHeight: 1 }}>
                                SAPITO
                            </h1>
                            <p style={{ color: theme.muted, fontSize: 12 }}>Mesa #{tableId}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                            {/* Botón cuenta — visible cuando hay pedidos o cuando la cuenta ya llegó */}
                            {(sessionOrderIds.length > 0 || accountRequested || bill) && (
                                <button
                                    onClick={handleRequestAccount}
                                    disabled={requestingAccount}
                                    style={{
                                        position: 'relative',
                                        padding: '8px 14px', borderRadius: 8,
                                        fontSize: 12, fontWeight: 700,
                                        background: bill
                                            ? theme.green + '22'
                                            : accountRequested
                                                ? theme.gold + '12'
                                                : theme.gold + '18',
                                        color: bill ? theme.green : theme.gold,
                                        border: `1px solid ${bill ? theme.green + '77' : theme.gold + '55'}`,
                                        whiteSpace: 'nowrap',
                                        opacity: requestingAccount ? 0.6 : 1,
                                        transition: 'all .2s',
                                    }}
                                >
                                    {bill ? '🧾 Ver cuenta' : accountRequested ? '⏳ Cuenta solicitada' : '🧾 Cuenta'}

                                    {/* Punto pulsante: nueva cuenta recibida */}
                                    {billNew && (
                                        <span style={{
                                            position: 'absolute', top: -4, right: -4,
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: theme.green,
                                            animation: 'pulse 1s infinite',
                                            border: `2px solid ${theme.surface}`,
                                        }} />
                                    )}
                                </button>
                            )}

                            {cartQty > 0 && (
                                <div style={{
                                    background: theme.accentDim, border: `1px solid ${theme.accent}`,
                                    borderRadius: 10, padding: '6px 14px',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <span style={{ fontSize: 16 }}>🛒</span>
                                    <span style={{ color: theme.accent, fontWeight: 700 }}>{cartQty}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setFilter(cat)} style={{
                                padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                                background: filter === cat ? theme.accent : theme.card,
                                color: filter === cat ? 'white' : theme.muted,
                                border: `1px solid ${filter === cat ? theme.accent : theme.border}`,
                            }}>
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

                {/* Banner: cuenta solicitada (mientras espera) */}
                {accountRequested && !bill && (
                    <div style={{
                        margin: '16px 16px 0',
                        background: '#1a1200', border: `1px solid ${theme.gold}44`,
                        borderRadius: 12, padding: '12px 16px',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{ fontSize: 20 }}>⏳</span>
                        <div>
                            <div style={{ color: theme.gold, fontWeight: 600, fontSize: 13 }}>Cuenta solicitada</div>
                            <div style={{ color: theme.muted, fontSize: 11, marginTop: 2 }}>
                                El encargado está preparando tu cuenta. Puedes seguir viendo el menú.
                            </div>
                        </div>
                    </div>
                )}

                {/* Banner: cuenta lista — invita a verla */}
                {bill && (
                    <div
                        className="scale-in"
                        onClick={() => { setShowBillModal(true); setBillNew(false) }}
                        style={{
                            margin: '16px 16px 0',
                            background: '#0d2200', border: `1px solid ${theme.green}`,
                            borderRadius: 12, padding: '14px 16px',
                            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        }}
                    >
                        <span style={{ fontSize: 22 }}>🧾</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: theme.green, fontWeight: 700, fontSize: 14 }}>¡Tu cuenta está lista!</div>
                            <div style={{ color: theme.muted, fontSize: 11, marginTop: 2 }}>
                                Toca aquí para ver tu nota de venta · Total: ${Number(bill.total).toFixed(2)}
                            </div>
                        </div>
                        <span style={{ color: theme.green, fontSize: 18 }}>›</span>
                    </div>
                )}

                {/* Productos */}
                <div style={{ padding: `16px 16px ${cart.length ? 180 : 32}px` }}>
                    {loading ? <Spinner /> : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {filtered.map((p, i) => (
                                <div key={p.id} style={{ animationDelay: `${i * 0.04}s` }}>
                                    <ProductCard
                                        product={p}
                                        cartItems={cart}
                                        onAdd={addToCart}
                                        onRemove={removeFromCart}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer carrito */}
                {cart.length > 0 && (
                    <div style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        background: theme.surface, borderTop: `1px solid ${theme.border}`,
                        padding: 16, zIndex: 30,
                    }}>
                        <div style={{ maxWidth: 520, margin: '0 auto' }}>
                            {/* Aviso si ya hay cuenta enviada */}
                            {bill && (
                                <div style={{
                                    marginBottom: 10, padding: '8px 12px', borderRadius: 8,
                                    background: theme.gold + '18', border: `1px solid ${theme.gold}44`,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <span style={{ fontSize: 16 }}>⚠️</span>
                                    <span style={{ color: theme.gold, fontSize: 12, fontWeight: 600 }}>
                                        Tu cuenta ya fue enviada. El encargado actualizará el total con este pedido.
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {cart.map(i => (
                                        <span key={`${i.id}-${i.selectedFlavor || 'base'}`} style={{ fontSize: 12, color: theme.muted }}>
                                            {i.qty}× {i.name}{i.selectedFlavor ? ` (${i.selectedFlavor})` : ''}
                                        </span>
                                    ))}
                                </div>
                                <span style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: theme.accent }}>
                                    ${cartTotal.toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: 10,
                                    fontSize: 16, fontWeight: 700, letterSpacing: 1,
                                    background: submitting ? theme.border : theme.accent,
                                    color: 'white',
                                }}
                            >
                                {submitting ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
