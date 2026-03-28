// src/pages/OwnerPage.jsx
// ─── Ruta: /dueno ──────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { canAccessOwner } from '../lib/auth'
import { theme, globalCss } from '../lib/theme'

const CATEGORIES = ['Entradas', 'CALDOS, COCTELES Y CEVICHES', 'ESPECIALIDADES', 'HAMBURGUESAS', 'ALITAS, PAPAS Y MAS',
    'HOT DOGS', 'PA BOTANEAR', 'SNACKS', 'CARNES', 'BURRITOS', 'TACOS', 'ALAMBRES', 'QUESOS FUNDIDOS Y COSTRAS',
    'ENSALADAS', 'CERVEZAS', 'COCTELERIA', 'BEBIDAS SIN ALCOHOL']
const EMOJIS = ['🧀', '🍗', '🌭', '🌯', '🫓', '🥙', '🍔', '🥗', '🍟', '🥪', '🧆', '🌮']

// ── helpers ───────────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
    )
}

function StatCard({ icon, label, value, color }) {
    return (
        <div style={{ background: theme.card, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 30, color, lineHeight: 1 }}>{value}</div>
            <div style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>{label}</div>
        </div>
    )
}

// ── ProductForm ───────────────────────────────────────────────────────────────
function ProductForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(
        initial || { name: '', category: 'Botana', price: '', description: '', photo: '🍔', available: true }
    )
    const [saving, setSaving] = useState(false)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSave = async () => {
        if (!form.name || !form.price) { alert('Nombre y precio son obligatorios'); return }
        setSaving(true)
        await onSave({ ...form, price: parseFloat(form.price) })
        setSaving(false)
    }

    return (
        <div className="scale-in" style={{ background: theme.surface, borderRadius: 14, border: `1px solid ${theme.accent}`, padding: 20, marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: theme.accent, letterSpacing: 2, marginBottom: 14 }}>
                {initial ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>NOMBRE *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} style={{ width: '100%', padding: '9px 12px' }} placeholder="Ej: Nachos Supremos" />
                </div>
                <div>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>CATEGORÍA</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)} style={{ width: '100%', padding: '9px 12px' }}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>PRECIO ($) *</label>
                    <input type="number" value={form.price} onChange={e => set('price', e.target.value)} style={{ width: '100%', padding: '9px 12px' }} placeholder="0.00" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>DESCRIPCIÓN</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} style={{ width: '100%', padding: '9px 12px', resize: 'none' }} placeholder="Descripción breve del platillo..." />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 6 }}>ICONO / FOTO</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {EMOJIS.map(e => (
                            <button key={e} onClick={() => set('photo', e)}
                                style={{ width: 38, height: 38, fontSize: 20, borderRadius: 8, background: form.photo === e ? theme.accentDim : theme.card, border: `1px solid ${form.photo === e ? theme.accent : theme.border}` }}>
                                {e}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 6 }}>DISPONIBLE</label>
                    <button onClick={() => set('available', !form.available)}
                        style={{ padding: '7px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, background: form.available ? theme.green + '22' : theme.red + '22', color: form.available ? theme.green : theme.red, border: `1px solid ${form.available ? theme.green : theme.red}44` }}>
                        {form.available ? '✓ Disponible' : '✗ Agotado'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={onCancel} style={{ flex: 1, padding: 11, borderRadius: 10, background: theme.card, border: `1px solid ${theme.border}`, color: theme.muted, fontWeight: 600 }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                    style={{ flex: 2, padding: 11, borderRadius: 10, background: saving ? theme.border : theme.accent, color: 'white', fontWeight: 700 }}>
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </div>
    )
}

// ── OwnerPage ─────────────────────────────────────────────────────────────────
export default function OwnerPage() {
    const [session, setSession] = useState(null)
    const [checkingSession, setCheckingSession] = useState(true)
    const [email, setEmail] = useState('')
    const [pass, setPass] = useState('')
    const [loginLoading, setLoginLoading] = useState(false)
    const [loginErr, setLoginErr] = useState('')
    const [tab, setTab] = useState('resumen')
    const [products, setProducts] = useState([])
    const [bills, setBills] = useState([])
    const [loading, setLoading] = useState(false)
    const [editProduct, setEditProduct] = useState(null)
    const [showNew, setShowNew] = useState(false)

    // Filtros historial
    const [filterMode, setFilterMode] = useState('dia')
    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10))
    const [filterWeek, setFilterWeek] = useState(new Date().toISOString().slice(0, 10))
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
    const authed = Boolean(session?.user)
    const ownerAllowed = canAccessOwner(session?.user)

    useEffect(() => {
        let mounted = true

        const bootstrapAuth = async () => {
            const { data, error } = await supabase.auth.getSession()
            if (!mounted) return
            if (error) {
                setLoginErr('No se pudo validar la sesión. Intenta de nuevo.')
                setSession(null)
            } else {
                setSession(data.session)
            }
            setCheckingSession(false)
        }

        bootstrapAuth()

        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession)
        })

        return () => {
            mounted = false
            listener.subscription.unsubscribe()
        }
    }, [])

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        const { data } = await supabase.from('products').select('*').order('category').order('name')
        if (data) setProducts(data)
    }, [])

    const fetchBills = useCallback(async () => {
        const { data } = await supabase
            .from('bills')
            .select('*, bill_items(*)')
            .order('closed_at', { ascending: false })
        if (data) setBills(data)
    }, [])

    useEffect(() => {
        if (!authed || !ownerAllowed) return
        setLoading(true)
        Promise.all([fetchProducts(), fetchBills()]).finally(() => setLoading(false))
    }, [authed, ownerAllowed, fetchProducts, fetchBills])

    // ── CRUD Productos ─────────────────────────────────────────────────────────
    const saveProduct = async (form) => {
        if (form.id) {
            await supabase.from('products').update({ name: form.name, category: form.category, price: form.price, description: form.description, photo: form.photo, available: form.available }).eq('id', form.id)
        } else {
            await supabase.from('products').insert({ name: form.name, category: form.category, price: form.price, description: form.description, photo: form.photo, available: form.available })
        }
        setEditProduct(null); setShowNew(false)
        await fetchProducts()
    }

    const deleteProduct = async (id) => {
        if (!window.confirm('¿Eliminar este producto del menú?')) return
        await supabase.from('products').delete().eq('id', id)
        await fetchProducts()
    }

    const toggleAvailable = async (p) => {
        await supabase.from('products').update({ available: !p.available }).eq('id', p.id)
        await fetchProducts()
    }

    // ── Filtrado de bills ──────────────────────────────────────────────────────
    const getWeekRange = (dateStr) => {
        const d = new Date(dateStr)
        const day = d.getDay()
        const mon = new Date(d); mon.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
        return [mon.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)]
    }

    const filteredBills = bills.filter(b => {
        const d = b.closed_at.slice(0, 10)
        if (filterMode === 'dia') return d === filterDate
        if (filterMode === 'semana') { const [s, e] = getWeekRange(filterWeek); return d >= s && d <= e }
        if (filterMode === 'mes') return b.closed_at.slice(0, 7) === filterMonth
        if (filterMode === 'ano') return b.closed_at.slice(0, 4) === filterYear
        return true
    })

    const totalRevenue = filteredBills.reduce((s, b) => s + Number(b.total), 0)
    const productSales = {}
    filteredBills.forEach(b => (b.bill_items || []).forEach(it => {
        if (!productSales[it.name]) productSales[it.name] = 0
        productSales[it.name] += it.qty
    }))
    const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // ── Resumen del día ────────────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10)
    const todayBills = bills.filter(b => b.closed_at.slice(0, 10) === today)
    const todayTotal = todayBills.reduce((s, b) => s + Number(b.total), 0)
    const todaySales = {}
    todayBills.forEach(b => (b.bill_items || []).forEach(it => {
        if (!todaySales[it.name]) todaySales[it.name] = 0
        todaySales[it.name] += it.qty
    }))
    const topToday = Object.entries(todaySales).sort((a, b) => b[1] - a[1]).slice(0, 3)

    // ── LOGIN ──────────────────────────────────────────────────────────────────
    const attempt = async () => {
        setLoginErr('')
        if (!email || !pass) {
            setLoginErr('Correo y contraseña son obligatorios.')
            return
        }

        setLoginLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
        setLoginLoading(false)

        if (error) {
            setLoginErr('Credenciales inválidas o usuario sin acceso.')
        } else {
            setPass('')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    if (checkingSession) {
        return (
            <>
                <style>{globalCss}</style>
                <div style={{ minHeight: '100vh', background: theme.bg }}>
                    <Spinner />
                </div>
            </>
        )
    }

    if (!authed) {
        return (
            <>
                <style>{globalCss}</style>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg, padding: 24 }}>
                    <div className="scale-in" style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.border}`, padding: 36, width: '100%', maxWidth: 380 }}>
                        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 34, color: theme.accent, letterSpacing: 3, marginBottom: 4 }}>PANEL DEL DUEÑO</h1>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', fontSize: 15, marginBottom: 10, border: `1px solid ${theme.border}` }}
                            placeholder="Correo"
                            autoFocus
                        />
                        <input
                            type="password" value={pass}
                            onChange={e => setPass(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && attempt()}
                            style={{ width: '100%', padding: '12px 16px', fontSize: 15, marginBottom: 10, border: `1px solid ${loginErr ? theme.red : theme.border}` }}
                            placeholder="Contraseña"
                        />
                        {loginErr && <p style={{ color: theme.red, fontSize: 12, marginBottom: 8 }}>{loginErr}</p>}
                        <button disabled={loginLoading} onClick={attempt} style={{ width: '100%', padding: 14, borderRadius: 10, background: loginLoading ? theme.border : theme.accent, color: 'white', fontWeight: 700, fontSize: 15 }}>
                            {loginLoading ? 'Validando...' : 'Entrar'}
                        </button>
                    </div>
                </div>
            </>
        )
    }

    if (!ownerAllowed) {
        return (
            <>
                <style>{globalCss}</style>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg, padding: 24 }}>
                    <div className="scale-in" style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.border}`, padding: 36, width: '100%', maxWidth: 430, textAlign: 'center' }}>
                        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: theme.red, letterSpacing: 3, marginBottom: 10 }}>ACCESO DENEGADO</h1>
                        <p style={{ color: theme.muted, fontSize: 14, marginBottom: 20 }}>
                            Esta sección es exclusiva para el dueño.
                        </p>
                        <button onClick={handleLogout} style={{ padding: '10px 16px', borderRadius: 10, background: theme.accent, color: 'white', fontWeight: 700, border: 'none' }}>
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </>
        )
    }

    // ── DASHBOARD ──────────────────────────────────────────────────────────────
    return (
        <>
            <style>{globalCss}</style>
            <div style={{ background: theme.bg, minHeight: '100vh', padding: '20px 16px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 38, color: theme.accent, letterSpacing: 3, lineHeight: 1 }}>PANEL DEL DUEÑO</h1>
                        <p style={{ color: theme.muted, fontSize: 13 }}>{session?.user?.email || 'El Rincón'}</p>
                    </div>
                    <button onClick={handleLogout} style={{ padding: '7px 14px', borderRadius: 8, background: theme.card, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 12 }}>
                        Salir
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${theme.border}`, paddingBottom: 12, flexWrap: 'wrap' }}>
                    {[{ k: 'resumen', l: '📊 Resumen' }, { k: 'historial', l: '🧾 Historial' }, { k: 'menu', l: '🍽️ Menú' }].map(t => (
                        <button key={t.k} onClick={() => setTab(t.k)}
                            style={{ padding: '9px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14, background: tab === t.k ? theme.accent : 'transparent', color: tab === t.k ? 'white' : theme.muted, border: `1px solid ${tab === t.k ? theme.accent : 'transparent'}` }}>
                            {t.l}
                        </button>
                    ))}
                </div>

                {loading ? <Spinner /> : (
                    <>
                        {/* ── RESUMEN ────────────────────────────────────────────────── */}
                        {tab === 'resumen' && (
                            <div className="fade-in">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                                    <StatCard icon="💰" label="Ventas Hoy" value={`$${todayTotal.toFixed(2)}`} color={theme.accent} />
                                    <StatCard icon="🧾" label="Cuentas Cerradas" value={todayBills.length} color={theme.green} />
                                    <StatCard icon="📊" label="Ticket Promedio" value={todayBills.length ? `$${(todayTotal / todayBills.length).toFixed(0)}` : '$0'} color={theme.blue} />
                                    <StatCard icon="🍽️" label="Productos Vendidos" value={Object.values(todaySales).reduce((s, v) => s + v, 0)} color={theme.gold} />
                                </div>
                                {topToday.length > 0 && (
                                    <div style={{ background: theme.card, borderRadius: 14, padding: 18, border: `1px solid ${theme.border}` }}>
                                        <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, marginBottom: 12 }}>TOP PRODUCTOS HOY</h3>
                                        {topToday.map(([name, qty], i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: i > 0 ? `1px solid ${theme.border}` : 'none' }}>
                                                <span style={{ fontSize: 14 }}>{i + 1}. {name}</span>
                                                <span style={{ color: theme.accent, fontWeight: 700 }}>{qty} unid.</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {todayBills.length === 0 && (
                                    <div style={{ textAlign: 'center', color: theme.muted, padding: '40px 0' }}>Sin ventas registradas hoy</div>
                                )}
                            </div>
                        )}

                        {/* ── HISTORIAL ──────────────────────────────────────────────── */}
                        {tab === 'historial' && (
                            <div className="fade-in">
                                {/* Filtros */}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {['dia', 'semana', 'mes', 'ano'].map(m => (
                                        <button key={m} onClick={() => setFilterMode(m)}
                                            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: filterMode === m ? theme.accent : theme.card, color: filterMode === m ? 'white' : theme.muted, border: `1px solid ${filterMode === m ? theme.accent : theme.border}`, textTransform: 'capitalize' }}>
                                            {m === 'dia' ? 'Día' : m === 'semana' ? 'Semana' : m === 'mes' ? 'Mes' : 'Año'}
                                        </button>
                                    ))}
                                    {filterMode === 'dia' && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />}
                                    {filterMode === 'semana' && <input type="date" value={filterWeek} onChange={e => setFilterWeek(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />}
                                    {filterMode === 'mes' && <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />}
                                    {filterMode === 'ano' && <input type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ padding: '6px 10px', fontSize: 13, width: 90 }} />}
                                </div>

                                {/* Resumen */}
                                <div style={{ background: theme.card, borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${theme.border}` }}>
                                    <span style={{ color: theme.muted, fontSize: 13 }}>{filteredBills.length} cuenta(s)</span>
                                    <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: theme.accent }}>Total: ${totalRevenue.toFixed(2)}</span>
                                </div>

                                {/* Top productos periodo */}
                                {topProducts.length > 0 && (
                                    <div style={{ background: theme.card, borderRadius: 12, padding: 14, border: `1px solid ${theme.border}`, marginBottom: 14 }}>
                                        <p style={{ color: theme.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Más vendido en el período</p>
                                        {topProducts.map(([name, qty], i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderTop: i > 0 ? `1px solid ${theme.border}` : 'none' }}>
                                                <span>{i + 1}. {name}</span>
                                                <span style={{ color: theme.gold, fontWeight: 700 }}>{qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {filteredBills.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: theme.muted, padding: '40px 0' }}>Sin registros para este período</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {filteredBills.map(bill => (
                                            <div key={bill.id} style={{ background: theme.card, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                                                <div style={{ background: theme.surface, padding: '8px 14px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 600, fontSize: 14 }}>Mesa #{bill.table_id}</span>
                                                    <span style={{ color: theme.muted, fontSize: 12 }}>
                                                        {new Date(bill.closed_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <div style={{ padding: '10px 14px' }}>
                                                    {(bill.bill_items || []).map((it, i) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderTop: i > 0 ? `1px solid ${theme.border}` : 'none' }}>
                                                            <span>{it.qty}× {it.name}</span>
                                                            <span style={{ color: theme.muted }}>${(Number(it.price) * it.qty).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.accent}44` }}>
                                                        <span style={{ color: theme.muted, fontSize: 12 }}>{bill.note || ''}</span>
                                                        <span style={{ fontWeight: 700, color: theme.accent }}>$ {Number(bill.total).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── MENÚ CRUD ──────────────────────────────────────────────── */}
                        {tab === 'menu' && (
                            <div className="fade-in">
                                {!showNew && !editProduct && (
                                    <button onClick={() => { setShowNew(true); setEditProduct(null) }}
                                        style={{ padding: '10px 22px', borderRadius: 10, background: theme.accent, color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
                                        + Nuevo Producto
                                    </button>
                                )}
                                {showNew && <ProductForm initial={null} onSave={saveProduct} onCancel={() => setShowNew(false)} />}
                                {editProduct && <ProductForm initial={editProduct} onSave={saveProduct} onCancel={() => setEditProduct(null)} />}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {products.map(p => (
                                        <div key={p.id} style={{ background: theme.card, borderRadius: 12, border: `1px solid ${theme.border}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ fontSize: 28 }}>{p.photo}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</span>
                                                    {!p.available && (
                                                        <span style={{ background: theme.red + '22', color: theme.red, border: `1px solid ${theme.red}44`, borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '2px 8px', textTransform: 'uppercase' }}>Agotado</span>
                                                    )}
                                                </div>
                                                <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{p.category} · ${Number(p.price).toFixed(2)}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                <button onClick={() => toggleAvailable(p)}
                                                    style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: p.available ? theme.green + '22' : theme.gold + '22', color: p.available ? theme.green : theme.gold, border: `1px solid ${p.available ? theme.green : theme.gold}44` }}>
                                                    {p.available ? 'Disponible' : 'Agotado'}
                                                </button>
                                                <button onClick={() => { setEditProduct(p); setShowNew(false) }}
                                                    style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}>
                                                    Editar
                                                </button>
                                                <button onClick={() => deleteProduct(p.id)}
                                                    style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, background: theme.red + '22', color: theme.red, border: `1px solid ${theme.red}44` }}>
                                                    Borrar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )
}
