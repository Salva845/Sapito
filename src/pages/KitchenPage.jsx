// src/pages/KitchenPage.jsx
// ─── Ruta: /cocina ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { theme, globalCss } from '../lib/theme'

const TABLES = [1, 2, 3, 4, 5, 6]
const CHUNK = 5

const STATUS_COLORS = { recibido: theme.blue, preparando: theme.gold, listo: theme.green }
const STATUS_LABELS = { recibido: 'Recibido', preparando: 'Preparando', listo: 'Listo' }

const PERSON_COLORS = [theme.accent, theme.blue, theme.green, theme.gold, '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#84cc16']

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
    )
}

// ── ItemRow ───────────────────────────────────────────────────────────────────
function ItemRow({ item, onStatusChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: theme.surface, borderRadius: 8, border: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 22 }}>{item.photo}</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                <div style={{ color: theme.muted, fontSize: 12 }}>×{item.qty}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {['recibido', 'preparando', 'listo'].map(s => (
                    <button key={s} onClick={() => onStatusChange(item.id, s)} style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: item.status === s ? STATUS_COLORS[s] + '33' : 'transparent',
                        color: item.status === s ? STATUS_COLORS[s] : theme.muted,
                        border: `1px solid ${item.status === s ? STATUS_COLORS[s] : theme.border}`,
                    }}>{STATUS_LABELS[s]}</button>
                ))}
            </div>
        </div>
    )
}

// ── TicketPreview ─────────────────────────────────────────────────────────────
function TicketPreview({ tableId, items, total, note }) {
    const dateStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })
    return (
        <div style={{ background: '#fffef5', borderRadius: 10, border: '1px dashed #c8b97a', padding: '16px 14px', color: '#1a1a00', fontSize: 13 }}>
            <div style={{ textAlign: 'center', marginBottom: 12, borderBottom: '1px dashed #c8b97a', paddingBottom: 10 }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 3 }}>SAPITO</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>NOTA DE VENTA</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: 11, marginBottom: 10 }}>
                <div><span style={{ color: '#888' }}>FECHA: </span>{dateStr}</div>
                <div><span style={{ color: '#888' }}>MESA: </span>{tableId}</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #c8b97a', fontSize: 10, color: '#888', textTransform: 'uppercase' }}>
                        <th style={{ textAlign: 'left', paddingBottom: 4, fontWeight: 700 }}>Cant.</th>
                        <th style={{ textAlign: 'left', paddingBottom: 4, fontWeight: 700 }}>Descripción</th>
                        <th style={{ textAlign: 'right', paddingBottom: 4, fontWeight: 700 }}>P.U.</th>
                        <th style={{ textAlign: 'right', paddingBottom: 4, fontWeight: 700 }}>Importe</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eee8cc' }}>
                            <td style={{ padding: '4px 0', fontWeight: 700 }}>{item.qty}</td>
                            <td style={{ padding: '4px 6px' }}>{item.name}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', color: '#666' }}>{Number(item.price).toFixed(0)}</td>
                            <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700 }}>{(Number(item.price) * item.qty).toFixed(0)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '2px solid #1a1a00' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>TOTAL $</span>
                <span style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: '#cc3300' }}>{Number(total).toFixed(2)}</span>
            </div>
            {note && <div style={{ marginTop: 6, fontSize: 10, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>{note}</div>}
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: '#888', borderTop: '1px dashed #c8b97a', paddingTop: 8 }}>
                ¡¡¡ GRACIAS POR SU VISITA !!!
            </div>
        </div>
    )
}

// ── SendBillModal ─────────────────────────────────────────────────────────────
function SendBillModal({ tableId, orders, onClose, onSend, previousBill }) {
    const buildItems = () => {
        const agg = {}
        orders.flatMap(o => o.order_items || []).forEach(it => {
            if (!agg[it.name]) agg[it.name] = { name: it.name, price: it.price, qty: 0 }
            agg[it.name].qty += it.qty
        })
        if (previousBill) {
            ; (previousBill.bill_items || []).forEach(it => {
                if (agg[it.name]) agg[it.name].qty = Math.max(agg[it.name].qty, it.qty)
                else agg[it.name] = { name: it.name, price: Number(it.price), qty: it.qty }
            })
        }
        return Object.values(agg)
    }

    const [items, setItems] = useState(buildItems)
    const [note, setNote] = useState('')
    const [showTicket, setShowTicket] = useState(false)
    const [sending, setSending] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newName, setNewName] = useState('')
    const [newPrice, setNewPrice] = useState('')
    const [newQty, setNewQty] = useState('1')

    const total = items.reduce((s, i) => s + Number(i.price) * i.qty, 0)

    const updateQty = (idx, val) =>
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(0, val) } : it).filter(it => it.qty > 0))

    const handleAddManual = () => {
        const name = newName.trim(), price = parseFloat(newPrice), qty = parseInt(newQty) || 1
        if (!name || isNaN(price) || price <= 0) return
        const existing = items.findIndex(it => it.name.toLowerCase() === name.toLowerCase())
        if (existing >= 0) setItems(prev => prev.map((it, i) => i === existing ? { ...it, qty: it.qty + qty } : it))
        else setItems(prev => [...prev, { name, price, qty }])
        setNewName(''); setNewPrice(''); setNewQty('1'); setShowAddForm(false)
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#000c', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div className="scale-in" style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.border}`, width: '100%', maxWidth: 500, maxHeight: '92vh', overflow: 'auto' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: theme.accent, letterSpacing: 2 }}>CUENTA — MESA #{tableId}</h2>
                        <p style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>Edita y envía la cuenta al cliente</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowTicket(p => !p)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: showTicket ? '#fffef5' : theme.surface, color: showTicket ? '#c8b97a' : theme.muted, border: `1px solid ${showTicket ? '#c8b97a' : theme.border}` }}>
                            {showTicket ? '✏️ Editar' : '🧾 Preview'}
                        </button>
                        <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 8, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 16 }}>✕</button>
                    </div>
                </div>
                <div style={{ padding: 20 }}>
                    {showTicket ? (
                        <TicketPreview tableId={tableId} items={items} total={total} note={note} />
                    ) : (
                        <>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ color: theme.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: .5 }}>
                                        <th style={{ textAlign: 'left', paddingBottom: 8 }}>Producto</th>
                                        <th style={{ textAlign: 'center', paddingBottom: 8, width: 70 }}>Cant.</th>
                                        <th style={{ textAlign: 'right', paddingBottom: 8 }}>P.U.</th>
                                        <th style={{ textAlign: 'right', paddingBottom: 8 }}>Total</th>
                                        <th style={{ paddingBottom: 8, width: 32 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i} style={{ borderTop: `1px solid ${theme.border}` }}>
                                            <td style={{ padding: '8px 0' }}>{item.name}</td>
                                            <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                                                <input type="number" min="1" value={item.qty} onChange={e => updateQty(i, parseInt(e.target.value) || 0)} style={{ width: 52, textAlign: 'center', padding: '4px 6px', fontSize: 13 }} />
                                            </td>
                                            <td style={{ padding: '8px 4px', textAlign: 'right', color: theme.muted }}>${Number(item.price).toFixed(2)}</td>
                                            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>${(Number(item.price) * item.qty).toFixed(2)}</td>
                                            <td style={{ padding: '8px 0 8px 8px' }}>
                                                <button onClick={() => updateQty(i, 0)} style={{ padding: '2px 6px', borderRadius: 6, background: theme.red + '22', color: theme.red, border: `1px solid ${theme.red}44`, fontSize: 12 }}>✕</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {showAddForm ? (
                                <div className="scale-in" style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: theme.surface, border: `1px solid ${theme.accent}44` }}>
                                    <p style={{ fontSize: 11, color: theme.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Agregar producto</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px', gap: 8, marginBottom: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 10, color: theme.muted, display: 'block', marginBottom: 3 }}>NOMBRE</label>
                                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Refresco" style={{ width: '100%', padding: '7px 10px', fontSize: 13 }} onKeyDown={e => e.key === 'Enter' && handleAddManual()} autoFocus />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: theme.muted, display: 'block', marginBottom: 3 }}>PRECIO ($)</label>
                                            <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" min="0" step="0.5" style={{ width: '100%', padding: '7px 10px', fontSize: 13 }} onKeyDown={e => e.key === 'Enter' && handleAddManual()} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: theme.muted, display: 'block', marginBottom: 3 }}>CANT.</label>
                                            <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} min="1" style={{ width: '100%', padding: '7px 10px', fontSize: 13 }} onKeyDown={e => e.key === 'Enter' && handleAddManual()} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => { setShowAddForm(false); setNewName(''); setNewPrice(''); setNewQty('1') }} style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 13 }}>Cancelar</button>
                                        <button onClick={handleAddManual} disabled={!newName.trim() || !newPrice} style={{ flex: 2, padding: '7px 0', borderRadius: 8, fontWeight: 700, fontSize: 13, background: (!newName.trim() || !newPrice) ? theme.border : theme.accent, color: 'white' }}>+ Agregar</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowAddForm(true)} style={{ marginTop: 12, width: '100%', padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'transparent', color: theme.accent, border: `1px dashed ${theme.accent}66` }}>
                                    + Agregar producto manualmente
                                </button>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '12px 0', borderTop: `2px solid ${theme.accent}` }}>
                                <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2 }}>TOTAL</span>
                                <span style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: theme.accent }}>${total.toFixed(2)}</span>
                            </div>
                            <div style={{ marginTop: 10 }}>
                                <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>NOTA (opcional)</label>
                                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 12px', fontSize: 13, resize: 'none' }} placeholder="Método de pago, observaciones..." />
                            </div>
                        </>
                    )}
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontWeight: 600 }}>Cancelar</button>
                        <button disabled={sending || items.length === 0} onClick={async () => { setSending(true); await onSend(items, total, note); setSending(false) }}
                            style={{ flex: 2, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 15, background: sending || items.length === 0 ? theme.border : theme.accent, color: 'white' }}>
                            {sending ? 'Enviando...' : '📤 Enviar cuenta al cliente'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── SplitPayModal — cobrar persona por persona ────────────────────────────────
function SplitPayModal({ tableId, splitRequest, onClose, onAllPaid }) {
    // splitRequest tiene .split_people con .[].split_items
    const [people, setPeople] = useState(splitRequest.split_people || [])
    const [confirming, setConfirming] = useState(null) // personId en proceso

    const allPaid = people.every(p => p.paid)

    const handlePayPerson = async (personId) => {
        setConfirming(personId)
        const { error } = await supabase
            .from('split_people')
            .update({ paid: true, paid_at: new Date().toISOString() })
            .eq('id', personId)
        if (!error) {
            setPeople(prev => prev.map(p => p.id === personId ? { ...p, paid: true } : p))
        }
        setConfirming(null)
    }

    const handleClose = async () => {
        if (allPaid) {
            await onAllPaid()
        } else {
            onClose()
        }
    }

    const totalPaid = people.filter(p => p.paid).reduce((s, p) => s + Number(p.subtotal), 0)
    const totalAll = people.reduce((s, p) => s + Number(p.subtotal), 0)
    const paidCount = people.filter(p => p.paid).length

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#000c', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div className="scale-in" style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.blue}55`, width: '100%', maxWidth: 500, maxHeight: '94vh', overflow: 'auto' }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: theme.blue, letterSpacing: 2 }}>DIVIDIR — MESA #{tableId}</h2>
                        <p style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                            {paidCount} de {people.length} personas han pagado
                        </p>
                    </div>
                    <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 8, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 16 }}>✕</button>
                </div>

                <div style={{ padding: 20 }}>
                    {/* Barra de progreso */}
                    <div style={{ background: theme.surface, borderRadius: 999, height: 6, marginBottom: 20, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: theme.green, width: `${(paidCount / people.length) * 100}%`, transition: 'width .4s ease' }} />
                    </div>

                    {/* Personas */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {people.map((person, pi) => {
                            const color = PERSON_COLORS[pi % PERSON_COLORS.length]
                            const isConf = confirming === person.id
                            const items = person.split_items || []

                            return (
                                <div key={person.id} style={{
                                    background: person.paid ? '#001a00' : theme.surface,
                                    borderRadius: 14,
                                    border: `1px solid ${person.paid ? theme.green + '66' : color + '44'}`,
                                    overflow: 'hidden',
                                    opacity: person.paid ? 0.85 : 1,
                                    transition: 'all .3s',
                                }}>
                                    {/* Cabecera persona */}
                                    <div style={{ padding: '10px 14px', background: color + '15', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 700, fontSize: 15, color }}>
                                                {person.paid ? '✓ ' : ''}{person.label}
                                            </span>
                                        </div>
                                        <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, color }}>
                                            ${Number(person.subtotal).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Items de la persona */}
                                    {items.length > 0 && (
                                        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${theme.border}` }}>
                                            {items.map((it, ii) => (
                                                <div key={ii} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: theme.muted }}>
                                                    <span>{it.qty}× {it.name}</span>
                                                    <span>${(Number(it.price) * it.qty).toFixed(0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Botón cobrar */}
                                    <div style={{ padding: '10px 14px' }}>
                                        {person.paid ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.green, fontSize: 13, fontWeight: 600 }}>
                                                <span>✓</span> Pagado
                                                {person.paid_at && (
                                                    <span style={{ color: theme.muted, fontSize: 11, marginLeft: 4 }}>
                                                        {new Date(person.paid_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                disabled={isConf}
                                                onClick={() => handlePayPerson(person.id)}
                                                style={{
                                                    width: '100%', padding: '9px 0', borderRadius: 9, fontWeight: 700, fontSize: 13,
                                                    background: isConf ? theme.border : color,
                                                    color: 'white',
                                                }}
                                            >
                                                {isConf ? 'Procesando...' : `💰 Cobrar $${Number(person.subtotal).toFixed(2)}`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Resumen */}
                    <div style={{ background: theme.surface, borderRadius: 12, padding: '12px 16px', border: `1px solid ${theme.border}`, marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span style={{ color: theme.muted }}>Cobrado</span>
                            <span style={{ color: theme.green, fontWeight: 700 }}>${totalPaid.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: theme.muted }}>Pendiente</span>
                            <span style={{ color: theme.red, fontWeight: 700 }}>${(totalAll - totalPaid).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.border}` }}>
                            <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1 }}>TOTAL</span>
                            <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: theme.accent }}>${totalAll.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontWeight: 600 }}>
                            {allPaid ? 'Cerrar' : 'Volver'}
                        </button>
                        {allPaid && (
                            <button onClick={handleClose} style={{ flex: 2, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 15, background: theme.green, color: 'white' }}>
                                ✓ Todos pagaron — Cerrar mesa
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── CloseMesaModal ────────────────────────────────────────────────────────────
function CloseMesaModal({ tableId, bill, onClose, onConfirmPago }) {
    const [confirming, setConfirming] = useState(false)
    const dateStr = new Date(bill.closed_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })
    const ticketNum = String(bill.id).replace(/-/g, '').slice(-4).toUpperCase()

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#000c', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div className="scale-in" style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.green}55`, width: '100%', maxWidth: 460, maxHeight: '92vh', overflow: 'auto' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: theme.green, letterSpacing: 2 }}>COBRAR — MESA #{tableId}</h2>
                        <p style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>Recibe el pago y cierra la mesa</p>
                    </div>
                    <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 8, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 16 }}>✕</button>
                </div>
                <div style={{ padding: 20 }}>
                    <div style={{ background: '#fffef5', borderRadius: 10, border: '1px dashed #c8b97a', padding: '16px 14px', color: '#1a1a00', fontSize: 13, marginBottom: 16 }}>
                        <div style={{ textAlign: 'center', marginBottom: 12, borderBottom: '1px dashed #c8b97a', paddingBottom: 10 }}>
                            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 3 }}>SAPITO</div>
                            <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>NOTA DE VENTA</div>
                            <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: '#cc3300', marginTop: 3 }}>#{ticketNum}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: 11, marginBottom: 10 }}>
                            <div><span style={{ color: '#888' }}>FECHA: </span>{dateStr}</div>
                            <div><span style={{ color: '#888' }}>MESA: </span>{bill.table_id}</div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #c8b97a', fontSize: 10, color: '#888', textTransform: 'uppercase' }}>
                                    <th style={{ textAlign: 'left', paddingBottom: 4, fontWeight: 700 }}>Cant.</th>
                                    <th style={{ textAlign: 'left', paddingBottom: 4, fontWeight: 700 }}>Descripción</th>
                                    <th style={{ textAlign: 'right', paddingBottom: 4, fontWeight: 700 }}>P.U.</th>
                                    <th style={{ textAlign: 'right', paddingBottom: 4, fontWeight: 700 }}>Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(bill.bill_items || []).map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #eee8cc' }}>
                                        <td style={{ padding: '4px 0', fontWeight: 700 }}>{item.qty}</td>
                                        <td style={{ padding: '4px 6px' }}>{item.name}</td>
                                        <td style={{ padding: '4px 6px', textAlign: 'right', color: '#666' }}>{Number(item.price).toFixed(0)}</td>
                                        <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700 }}>{(Number(item.price) * item.qty).toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '2px solid #1a1a00' }}>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>TOTAL $</span>
                            <span style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: '#cc3300' }}>{Number(bill.total).toFixed(2)}</span>
                        </div>
                        {bill.note && <div style={{ marginTop: 6, fontSize: 10, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>{bill.note}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, fontWeight: 600 }}>Cancelar</button>
                        <button disabled={confirming} onClick={async () => { setConfirming(true); await onConfirmPago(); setConfirming(false) }}
                            style={{ flex: 2, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 15, background: confirming ? theme.border : theme.green, color: 'white' }}>
                            {confirming ? 'Cerrando...' : '💰 Confirmar pago y cerrar mesa'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── KitchenPage ───────────────────────────────────────────────────────────────
export default function KitchenPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTable, setActiveTable] = useState(null)
    const [tableStatusMap, setTableStatusMap] = useState({})
    const [sentBills, setSentBills] = useState({})
    const [splitRequests, setSplitRequests] = useState({}) // { tableId: splitRequest }
    const [realtimeStatus, setRealtimeStatus] = useState('connecting')

    // modal: null | { type:'send'|'close'|'split', tableId, bill?, splitRequest? }
    const [modal, setModal] = useState(null)

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchOrders = useCallback(async () => {
        const { data } = await supabase
            .from('orders')
            .select('id,table_id,request_account,account_handled,created_at,order_items(*)')
            .eq('closed', false)
            .order('created_at', { ascending: true })
        if (data) setOrders(data)
    }, [])

    const fetchTables = useCallback(async () => {
        const { data } = await supabase.from('tables').select('id,status')
        if (data) {
            const map = {}
            data.forEach(t => { map[t.id] = t.status })
            setTableStatusMap(map)
        }
    }, [])

    const fetchSentBills = useCallback(async () => {
        const { data } = await supabase.from('bills').select('*, bill_items(*)').eq('status', 'sent')
        if (data) {
            const map = {}
            data.forEach(b => { map[b.table_id] = b })
            setSentBills(map)
            setModal(prev => {
                if (prev?.type === 'close') {
                    const freshBill = data.find(b => b.table_id === prev.tableId)
                    if (freshBill) return { ...prev, bill: freshBill }
                }
                return prev
            })
        }
    }, [])

    // Splits pendientes de cobro
    const fetchSplitRequests = useCallback(async () => {
        const { data } = await supabase
            .from('split_requests')
            .select('*, split_people(*, split_items(*))')
            .eq('status', 'pending')
        if (data) {
            const map = {}
            data.forEach(sr => { map[sr.table_id] = sr })
            setSplitRequests(map)
        }
    }, [])

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            await Promise.all([fetchOrders(), fetchTables(), fetchSentBills(), fetchSplitRequests()])
            setLoading(false)
        }
        init()

        let ch, pollInterval, reconnectTimeout

        const subscribe = () => {
            if (ch) supabase.removeChannel(ch)
            ch = supabase.channel('kitchen-live-' + Date.now())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchOrders)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchTables)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchSentBills)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'bill_items' }, fetchSentBills)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'split_requests' }, fetchSplitRequests)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'split_people' }, fetchSplitRequests)
                .subscribe(status => {
                    if (status === 'SUBSCRIBED') {
                        setRealtimeStatus('ok')
                        fetchOrders(); fetchTables(); fetchSentBills(); fetchSplitRequests()
                    } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
                        setRealtimeStatus('error')
                        reconnectTimeout = setTimeout(subscribe, 3000)
                    } else {
                        setRealtimeStatus('connecting')
                    }
                })
        }

        subscribe()
        pollInterval = setInterval(() => { fetchOrders(); fetchTables(); fetchSentBills(); fetchSplitRequests() }, 30000)
        return () => { if (ch) supabase.removeChannel(ch); clearInterval(pollInterval); clearTimeout(reconnectTimeout) }
    }, [fetchOrders, fetchTables, fetchSentBills, fetchSplitRequests])

    // ── Cambiar status de item ────────────────────────────────────────────────
    const handleStatusChange = async (itemId, status) => {
        await supabase.from('order_items').update({ status }).eq('id', itemId)
        setOrders(prev => prev.map(o => ({ ...o, order_items: (o.order_items || []).map(it => it.id === itemId ? { ...it, status } : it) })))
    }

    // ── Enviar cuenta ─────────────────────────────────────────────────────────
    const handleSendBill = async (tableId, billItems, total, note) => {
        const existingBill = sentBills[tableId]
        if (existingBill) await supabase.from('bills').update({ status: 'replaced' }).eq('id', existingBill.id)
        const { data: bill, error } = await supabase.from('bills').insert({ table_id: tableId, total, note, status: 'sent' }).select().single()
        if (error || !bill) { alert('Error al enviar la cuenta'); return }
        await supabase.from('bill_items').insert(billItems.map(i => ({ bill_id: bill.id, name: i.name, price: i.price, qty: i.qty })))
        await supabase.from('orders').update({ account_handled: true }).eq('table_id', tableId).eq('request_account', true)
        setModal(null); fetchSentBills(); fetchOrders()
    }

    // ── Confirmar pago y cerrar mesa (cuenta normal) ──────────────────────────
    const handleConfirmPago = async (tableId, billId) => {
        await supabase.from('bills').update({ status: 'paid' }).eq('id', billId)
        await supabase.from('bills').update({ status: 'replaced' }).eq('table_id', tableId).eq('status', 'sent').neq('id', billId)
        await supabase.from('orders').update({ closed: true }).eq('table_id', tableId).eq('closed', false)
        await supabase.from('tables').update({ status: 'free' }).eq('id', tableId)
        setModal(null); fetchOrders(); fetchTables(); fetchSentBills()
    }

    // ── Cerrar mesa después de que todos los splits pagaron ───────────────────
    const handleSplitAllPaid = async (tableId, splitRequestId) => {
        await supabase.from('split_requests').update({ status: 'handled' }).eq('id', splitRequestId)
        await supabase.from('orders').update({ closed: true }).eq('table_id', tableId).eq('closed', false)
        await supabase.from('tables').update({ status: 'free' }).eq('id', tableId)
        setModal(null); fetchOrders(); fetchTables(); fetchSplitRequests()
    }

    // ── Datos derivados ───────────────────────────────────────────────────────
    const realOrders = orders.filter(o => !o.request_account)
    const accountReqs = orders.filter(o => o.request_account && !o.account_handled)

    const byTable = {}
    realOrders.forEach(o => {
        if (!byTable[o.table_id]) byTable[o.table_id] = []
        byTable[o.table_id].push(o)
    })
    const activeTables = Object.keys(byTable).map(Number)

    const tablesNeedingBillUpdate = activeTables.filter(tid => {
        const sentBill = sentBills[tid]
        if (!sentBill) return false
        return (byTable[tid] || []).some(o => o.created_at > sentBill.closed_at)
    })

    useEffect(() => {
        if (activeTables.length && !activeTables.includes(activeTable)) setActiveTable(activeTables[0])
        if (!activeTables.length) setActiveTable(null)
    }, [JSON.stringify(activeTables)])

    const currentOrders = activeTable ? (byTable[activeTable] || []) : []
    const comandas = []
    currentOrders.forEach(order => {
        const items = order.order_items || []
        for (let i = 0; i < items.length; i += CHUNK) {
            comandas.push({ orderId: order.id, createdAt: order.created_at, chunk: items.slice(i, i + CHUNK), part: Math.floor(i / CHUNK) + 1, parts: Math.ceil(items.length / CHUNK) })
        }
    })

    const tableHasPending = (tid) =>
        (byTable[tid] || []).some(o => (o.order_items || []).some(it => it.status !== 'listo'))

    // ── Qué hace el clic en cada mesa ────────────────────────────────────────
    const handleMesaClick = (t) => {
        const splitReq = splitRequests[t]
        const sentBill = sentBills[t]
        const hasNewOrders = tablesNeedingBillUpdate.includes(t)

        if (splitReq) {
            // Tiene solicitud de división activa → modal de cobro por persona
            setModal({ type: 'split', tableId: t, splitRequest: splitReq })
        } else if (sentBill && hasNewOrders) {
            setModal({ type: 'send', tableId: t })
        } else if (sentBill) {
            setModal({ type: 'close', tableId: t, bill: sentBill })
        } else if (byTable[t]) {
            setModal({ type: 'send', tableId: t })
        }
    }

    return (
        <>
            <style>{globalCss}</style>
            <div style={{ background: theme.bg, minHeight: '100vh', padding: '20px 16px 40px' }}>

                {/* Topbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 38, color: theme.accent, letterSpacing: 3 }}>COCINA</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: realtimeStatus === 'ok' ? theme.green + '18' : realtimeStatus === 'error' ? theme.red + '18' : theme.gold + '18', border: `1px solid ${realtimeStatus === 'ok' ? theme.green + '44' : realtimeStatus === 'error' ? theme.red + '44' : theme.gold + '44'}` }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: realtimeStatus === 'ok' ? theme.green : realtimeStatus === 'error' ? theme.red : theme.gold, animation: realtimeStatus !== 'ok' ? 'pulse 1s infinite' : 'none', display: 'inline-block' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: realtimeStatus === 'ok' ? theme.green : realtimeStatus === 'error' ? theme.red : theme.gold }}>
                            {realtimeStatus === 'ok' ? 'En vivo' : realtimeStatus === 'error' ? 'Reconectando...' : 'Conectando...'}
                        </span>
                    </div>
                </div>
                <p style={{ color: theme.muted, fontSize: 13, marginBottom: 20 }}>{realOrders.length} pedido(s) activo(s)</p>

                {/* Alertas */}
                {accountReqs.length > 0 && (
                    <div style={{ background: '#2a1800', border: `1px solid ${theme.gold}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>⚠️</span>
                        <div>
                            <div style={{ color: theme.gold, fontWeight: 700 }}>Solicitud de cuenta pendiente</div>
                            <div style={{ color: theme.muted, fontSize: 12 }}>Mesa(s): {[...new Set(accountReqs.map(o => `#${o.table_id}`))].join(', ')} — toca la mesa para enviar la cuenta</div>
                        </div>
                    </div>
                )}

                {Object.keys(splitRequests).length > 0 && (
                    <div style={{ background: '#000d1a', border: `1px solid ${theme.blue}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>✂️</span>
                        <div>
                            <div style={{ color: theme.blue, fontWeight: 700 }}>División de cuenta solicitada</div>
                            <div style={{ color: theme.muted, fontSize: 12 }}>Mesa(s): {Object.keys(splitRequests).map(t => `#${t}`).join(', ')} — toca la mesa para cobrar por persona</div>
                        </div>
                    </div>
                )}

                {Object.keys(sentBills).length > 0 && (
                    <div style={{ background: '#0d2200', border: `1px solid ${theme.green}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>💵</span>
                        <div>
                            <div style={{ color: theme.green, fontWeight: 700 }}>Cuenta enviada — esperando cobro</div>
                            <div style={{ color: theme.muted, fontSize: 12 }}>Mesa(s): {Object.keys(sentBills).map(t => `#${t}`).join(', ')} — toca la mesa para confirmar pago</div>
                        </div>
                    </div>
                )}

                {tablesNeedingBillUpdate.length > 0 && (
                    <div style={{ background: '#1a0e00', border: `1px solid ${theme.accent}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>🔄</span>
                        <div>
                            <div style={{ color: theme.accent, fontWeight: 700 }}>Pedidos nuevos tras cuenta enviada</div>
                            <div style={{ color: theme.muted, fontSize: 12 }}>Mesa(s): {tablesNeedingBillUpdate.map(t => `#${t}`).join(', ')} — toca la mesa para reenviar</div>
                        </div>
                    </div>
                )}

                {loading ? <Spinner /> : (
                    <>
                        {/* Selector mesas activas */}
                        {activeTables.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                {activeTables.map(tid => {
                                    const pending = tableHasPending(tid)
                                    const itemCount = (byTable[tid] || []).reduce((s, o) => s + (o.order_items || []).length, 0)
                                    return (
                                        <button key={tid} onClick={() => setActiveTable(tid)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: activeTable === tid ? theme.accent : theme.card, color: activeTable === tid ? 'white' : theme.muted, border: `1px solid ${activeTable === tid ? theme.accent : theme.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            Mesa #{tid}
                                            <span style={{ background: activeTable === tid ? 'white' : theme.accent, color: activeTable === tid ? theme.accent : 'white', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{itemCount}</span>
                                            {pending && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: theme.red + '22', color: theme.red, border: `1px solid ${theme.red}55`, borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: theme.red, animation: 'pulse 1s infinite', display: 'inline-block' }} />
                                                    Pendiente
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Comandas */}
                        {comandas.length === 0 && (
                            <div style={{ textAlign: 'center', color: theme.muted, padding: '60px 0' }}>
                                <div style={{ fontSize: 52, marginBottom: 12 }}>🍽️</div>
                                <p>Sin pedidos activos</p>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                            {comandas.map((c, ci) => (
                                <div key={`${c.orderId}-${c.part}`} className="scale-in" style={{ animationDelay: `${ci * 0.06}s`, background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                                    <div style={{ background: theme.surface, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 2, color: theme.accent }}>
                                            MESA #{activeTable}{c.parts > 1 ? ` — COMANDA ${c.part}/${c.parts}` : ''}
                                        </span>
                                        <span style={{ color: theme.muted, fontSize: 12 }}>{new Date(c.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {c.chunk.map(item => <ItemRow key={item.id} item={item} onStatusChange={handleStatusChange} />)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grid de mesas */}
                        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 20 }}>
                            <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, marginBottom: 12 }}>MESAS</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 380 }}>
                                {TABLES.map(t => {
                                    const hasOrders = !!byTable[t]
                                    const status = tableStatusMap[t] || 'free'
                                    const hasReq = accountReqs.some(o => o.table_id === t)
                                    const isFree = status === 'free' && !hasOrders
                                    const billSent = !!sentBills[t]
                                    const hasSplit = !!splitRequests[t]
                                    const needsUpdate = tablesNeedingBillUpdate.includes(t)
                                    const canClick = hasOrders || billSent || hasSplit

                                    const bg = hasSplit ? '#000d1a'
                                        : needsUpdate ? '#1a0e00'
                                            : billSent ? '#0d2200'
                                                : hasReq ? '#2a1800'
                                                    : hasOrders ? theme.accentDim
                                                        : isFree ? '#0e1f0e'
                                                            : theme.card

                                    const border = hasSplit ? theme.blue
                                        : needsUpdate ? theme.accent
                                            : billSent ? theme.green
                                                : hasReq ? theme.gold
                                                    : hasOrders ? theme.accent
                                                        : isFree ? theme.green + '55'
                                                            : theme.border

                                    const label = hasSplit ? 'División solicitada'
                                        : needsUpdate ? 'Pedidos nuevos'
                                            : billSent ? 'Cuenta enviada'
                                                : hasOrders ? 'Activa'
                                                    : isFree ? 'Vacía'
                                                        : 'Libre'

                                    const labelColor = hasSplit ? theme.blue
                                        : needsUpdate ? theme.accent
                                            : billSent ? theme.green
                                                : hasOrders ? theme.accent
                                                    : isFree ? theme.green
                                                        : theme.muted

                                    return (
                                        <button key={t} onClick={() => canClick && handleMesaClick(t)} style={{ padding: '14px 8px', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: bg, border: `1px solid ${border}`, cursor: canClick ? 'pointer' : 'default', position: 'relative' }}>
                                            {/* Puntos pulsantes por estado */}
                                            {hasSplit && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: theme.blue, animation: 'pulse 1s infinite' }} />}
                                            {hasReq && !billSent && !hasSplit && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: theme.gold, animation: 'pulse 1s infinite' }} />}
                                            {needsUpdate && !hasSplit && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: theme.accent, animation: 'pulse 1s infinite' }} />}
                                            {billSent && !needsUpdate && !hasSplit && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: theme.green, animation: 'pulse 1s infinite' }} />}

                                            <span style={{ fontSize: 24 }}>🪑</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: labelColor }}>Mesa {t}</span>
                                            <span style={{ fontSize: 10, color: theme.muted }}>{label}</span>
                                            {hasSplit && <span style={{ fontSize: 10, color: theme.blue, fontWeight: 700, marginTop: 2 }}>Cobrar por persona ›</span>}
                                            {needsUpdate && !hasSplit && <span style={{ fontSize: 10, color: theme.accent, fontWeight: 700, marginTop: 2 }}>Reenviar cuenta ›</span>}
                                            {billSent && !needsUpdate && !hasSplit && <span style={{ fontSize: 10, color: theme.green, fontWeight: 700, marginTop: 2 }}>Cobrar ›</span>}
                                            {hasOrders && !billSent && !hasSplit && <span style={{ fontSize: 10, color: theme.accent, fontWeight: 600, marginTop: 2 }}>Enviar cuenta ›</span>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Modales */}
                {modal?.type === 'send' && (
                    <SendBillModal tableId={modal.tableId} orders={byTable[modal.tableId] || []} previousBill={sentBills[modal.tableId] || null} onClose={() => setModal(null)} onSend={(items, total, note) => handleSendBill(modal.tableId, items, total, note)} />
                )}
                {modal?.type === 'close' && (
                    <CloseMesaModal tableId={modal.tableId} bill={modal.bill} onClose={() => setModal(null)} onConfirmPago={() => handleConfirmPago(modal.tableId, modal.bill.id)} />
                )}
                {modal?.type === 'split' && (
                    <SplitPayModal
                        tableId={modal.tableId}
                        splitRequest={modal.splitRequest}
                        onClose={() => setModal(null)}
                        onAllPaid={() => handleSplitAllPaid(modal.tableId, modal.splitRequest.id)}
                    />
                )}
            </div>
        </>
    )
}