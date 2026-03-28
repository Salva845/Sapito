// src/pages/OwnerPage.jsx
// ─── Ruta: /dueno ──────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { canAccessOwner } from '../lib/auth'
import { theme, globalCss } from '../lib/theme'

const CATEGORIES = ['Entradas', 'CALDOS, COCTELES Y CEVICHES', 'ESPECIALIDADES', 'HAMBURGUESAS', 'ALITAS, PAPAS Y MAS',
    'HOT DOGS', 'PA BOTANEAR', 'SNACKS', 'CARNES', 'BURRITOS', 'TACOS', 'ALAMBRES', 'QUESOS FUNDIDOS Y COSTRAS',
    'ENSALADAS', 'CERVEZAS', 'COCTELERIA', 'BEBIDAS SIN ALCOHOL']
const EMOJIS = ['🧀', '🍗', '🌭', '🌯', '🫓', '🥙', '🍔', '🥗', '🍟', '🥪', '🧆', '🌮',
    '🍺', '🍹', '🥤', '☕', '🥩', '🫕', '🌶️', '🧅', '🍤', '🫙']

const BUSINESS_TIMEZONE = 'America/Mexico_City'

// ── helpers ───────────────────────────────────────────────────────────────────

/** Devuelve true si el valor del campo photo es una URL (no emoji) */
function isUrl(str) {
    return typeof str === 'string' && (str.startsWith('http') || str.startsWith('/'))
}

/** Renderiza foto o emoji según el tipo de valor */
export function ProductPhoto({ photo, size = 38, borderRadius = 8 }) {
    if (isUrl(photo)) {
        return (
            <img
                src={photo}
                alt=""
                style={{
                    width: size,
                    height: size,
                    objectFit: 'cover',
                    borderRadius,
                    display: 'block',
                    background: theme.surface,
                }}
            />
        )
    }
    return <span style={{ fontSize: size * 0.7, lineHeight: 1 }}>{photo || '🍔'}</span>
}

function Spinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
    )
}

const getPartsInTimeZone = (dateValue, timeZone = BUSINESS_TIMEZONE) => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
    const parts = formatter.formatToParts(new Date(dateValue))
    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    return { year, month, day }
}

const getDateKeyInBusinessTz = (dateValue, timeZone = BUSINESS_TIMEZONE) => {
    const { year, month, day } = getPartsInTimeZone(dateValue, timeZone)
    return `${year}-${month}-${day}`
}

const getMonthKeyInBusinessTz = (dateValue, timeZone = BUSINESS_TIMEZONE) => {
    const { year, month } = getPartsInTimeZone(dateValue, timeZone)
    return `${year}-${month}`
}

const getYearKeyInBusinessTz = (dateValue, timeZone = BUSINESS_TIMEZONE) => {
    const { year } = getPartsInTimeZone(dateValue, timeZone)
    return year
}

const parseDateKey = (dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0)
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

// ── BUCKET NAME — crea este bucket en Supabase Storage ────────────────────────
const BUCKET = 'product-photos'

// ── ProductForm ───────────────────────────────────────────────────────────────
function ProductForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(
        initial || { name: '', category: CATEGORIES[0], price: '', description: '', photo: '🍔', flavors: '', available: true }
    )
    const [saving, setSaving] = useState(false)
    // 'emoji' | 'upload'
    const [photoMode, setPhotoMode] = useState(isUrl(initial?.photo) ? 'upload' : 'emoji')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [previewUrl, setPreviewUrl] = useState(isUrl(initial?.photo) ? initial.photo : null)
    const fileRef = useRef()

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    // ── subir imagen a Supabase Storage ───────────────────────────────────────
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { setUploadError('Solo se aceptan imágenes (jpg, png, webp…)'); return }
        if (file.size > 4 * 1024 * 1024) { setUploadError('La imagen no debe superar 4 MB'); return }

        setUploadError('')
        setUploading(true)

        // Preview local inmediato
        const localUrl = URL.createObjectURL(file)
        setPreviewUrl(localUrl)

        try {
            const ext = file.name.split('.').pop()
            const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
            if (upErr) throw upErr

            const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
            set('photo', data.publicUrl)
            setPreviewUrl(data.publicUrl)
        } catch (err) {
            console.error(err)
            setUploadError('Error al subir la imagen. Verifica que el bucket "product-photos" exista y sea público.')
            setPreviewUrl(null)
            set('photo', '🍔')
        } finally {
            setUploading(false)
        }
    }

    const handleRemovePhoto = () => {
        setPreviewUrl(null)
        set('photo', '🍔')
        setPhotoMode('emoji')
        if (fileRef.current) fileRef.current.value = ''
    }

    const switchMode = (mode) => {
        setPhotoMode(mode)
        setUploadError('')
        if (mode === 'emoji') {
            setPreviewUrl(null)
            // Mantén el emoji actual si ya había uno, si no usa default
            if (isUrl(form.photo)) set('photo', '🍔')
        } else {
            // Al pasar a upload, si ya hay URL se muestra el preview
            if (isUrl(form.photo)) setPreviewUrl(form.photo)
        }
    }

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
                {/* Nombre */}
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>NOMBRE *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} style={{ width: '100%', padding: '9px 12px' }} placeholder="Ej: Nachos Supremos" />
                </div>

                {/* Categoría */}
                <div>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>CATEGORÍA</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)} style={{ width: '100%', padding: '9px 12px' }}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>

                {/* Precio */}
                <div>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>PRECIO ($) *</label>
                    <input type="number" value={form.price} onChange={e => set('price', e.target.value)} style={{ width: '100%', padding: '9px 12px' }} placeholder="0.00" />
                </div>

                {/* Descripción */}
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>DESCRIPCIÓN</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} style={{ width: '100%', padding: '9px 12px', resize: 'none' }} placeholder="Descripción breve del platillo..." />
                </div>

                {/* Sabores / variantes */}
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 4 }}>SABORES (opcionales)</label>
                    <input
                        value={form.flavors || ''}
                        onChange={e => set('flavors', e.target.value)}
                        style={{ width: '100%', padding: '9px 12px' }}
                        placeholder="Ej: Fresa, Vainilla, Chocolate"
                    />
                    <small style={{ color: theme.muted, display: 'block', marginTop: 4, fontSize: 11 }}>
                        Sepáralos por coma para que el cliente pueda elegir una variante.
                    </small>
                </div>

                {/* ── FOTO / ICONO ─────────────────────────────────────────── */}
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 11, color: theme.muted, display: 'block', marginBottom: 8 }}>FOTO / ICONO</label>

                    {/* Tabs selector */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {[
                            { id: 'emoji', label: '😀 Emoji' },
                            { id: 'upload', label: '📷 Foto' },
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => switchMode(id)}
                                style={{
                                    padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                    background: photoMode === id ? theme.accentDim : theme.card,
                                    color: photoMode === id ? theme.accent : theme.muted,
                                    border: `1px solid ${photoMode === id ? theme.accent : theme.border}`,
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Panel emoji */}
                    {photoMode === 'emoji' && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {EMOJIS.map(e => (
                                <button key={e} onClick={() => set('photo', e)}
                                    style={{ width: 38, height: 38, fontSize: 20, borderRadius: 8, background: form.photo === e ? theme.accentDim : theme.card, border: `1px solid ${form.photo === e ? theme.accent : theme.border}` }}>
                                    {e}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Panel upload */}
                    {photoMode === 'upload' && (
                        <div>
                            {/* Preview */}
                            {previewUrl ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                                    <img
                                        src={previewUrl}
                                        alt="preview"
                                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.card }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <span style={{ color: theme.green, fontSize: 13, fontWeight: 600 }}>✓ Foto cargada</span>
                                        <button
                                            onClick={handleRemovePhoto}
                                            style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, background: theme.red + '22', color: theme.red, border: `1px solid ${theme.red}44` }}
                                        >
                                            Quitar foto
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Drop zone / click to upload
                                <div
                                    onClick={() => !uploading && fileRef.current?.click()}
                                    style={{
                                        border: `2px dashed ${uploadError ? theme.red : theme.border}`,
                                        borderRadius: 10,
                                        padding: '24px 16px',
                                        textAlign: 'center',
                                        cursor: uploading ? 'wait' : 'pointer',
                                        background: theme.card,
                                        marginBottom: 8,
                                        transition: 'border-color .2s',
                                    }}
                                >
                                    {uploading ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 24, height: 24, border: `2px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                            <span style={{ color: theme.muted, fontSize: 13 }}>Subiendo imagen…</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                                            <div style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>Toca para seleccionar una foto</div>
                                            <div style={{ color: theme.muted, fontSize: 11, marginTop: 4 }}>JPG, PNG o WEBP · máx. 4 MB</div>
                                        </>
                                    )}
                                </div>
                            )}

                            {uploadError && (
                                <p style={{ color: theme.red, fontSize: 12, marginTop: 4 }}>⚠ {uploadError}</p>
                            )}

                            {/* Input file oculto */}
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />

                            {/* Si no hay foto aún, muestra aviso del emoji de respaldo */}
                            {!previewUrl && !uploading && (
                                <p style={{ color: theme.muted, fontSize: 11, marginTop: 8 }}>
                                    Si no subes foto, se usará el emoji seleccionado como ícono.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Disponible */}
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
                <button onClick={handleSave} disabled={saving || uploading}
                    style={{ flex: 2, padding: 11, borderRadius: 10, background: (saving || uploading) ? theme.border : theme.accent, color: 'white', fontWeight: 700 }}>
                    {saving ? 'Guardando…' : uploading ? 'Subiendo foto…' : 'Guardar'}
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
    const [filterDate, setFilterDate] = useState(getDateKeyInBusinessTz(new Date()))
    const [filterWeek, setFilterWeek] = useState(getDateKeyInBusinessTz(new Date()))
    const [filterMonth, setFilterMonth] = useState(getMonthKeyInBusinessTz(new Date()))
    const [filterYear, setFilterYear] = useState(getYearKeyInBusinessTz(new Date()))
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
        const payload = {
            name: form.name,
            category: form.category,
            price: form.price,
            description: form.description,
            photo: form.photo,
            flavors: (form.flavors || '').trim(),
            available: form.available,
        }
        if (form.id) {
            await supabase.from('products').update(payload).eq('id', form.id)
        } else {
            await supabase.from('products').insert(payload)
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
        const date = parseDateKey(dateStr)
        const day = date.getDay()
        const mon = new Date(date)
        mon.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
        const sun = new Date(mon)
        sun.setDate(mon.getDate() + 6)
        return [getDateKeyInBusinessTz(mon), getDateKeyInBusinessTz(sun)]
    }

    const filteredBills = bills.filter(b => {
        const billDate = getDateKeyInBusinessTz(b.closed_at)
        if (filterMode === 'dia') return billDate === filterDate
        if (filterMode === 'semana') { const [s, e] = getWeekRange(filterWeek); return billDate >= s && billDate <= e }
        if (filterMode === 'mes') return getMonthKeyInBusinessTz(b.closed_at) === filterMonth
        if (filterMode === 'ano') return getYearKeyInBusinessTz(b.closed_at) === filterYear
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
    const todayStr = getDateKeyInBusinessTz(new Date())
    const todayBills = bills.filter(b => getDateKeyInBusinessTz(b.closed_at) === todayStr)
    const todayTotal = todayBills.reduce((s, b) => s + Number(b.total), 0)
    const todaySales = {}
    todayBills.forEach(b => (b.bill_items || []).forEach(it => {
        if (!todaySales[it.name]) todaySales[it.name] = 0
        todaySales[it.name] += it.qty
    }))
    const topToday = Object.entries(todaySales).sort((a, b) => b[1] - a[1]).slice(0, 3)

    // ── Login / gate ───────────────────────────────────────────────────────────
    const attempt = async () => {
        setLoginErr('')
        if (!email || !pass) { setLoginErr('Correo y contraseña son obligatorios.'); return }
        setLoginLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
        setLoginLoading(false)
        if (error) setLoginErr('Credenciales inválidas o usuario sin acceso.')
        else setPass('')
    }

    const handleLogout = async () => { await supabase.auth.signOut() }

    if (checkingSession) return (
        <>
            <style>{globalCss}</style>
            <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner />
            </div>
        </>
    )

    // ── Auth gate ──────────────────────────────────────────────────────────────
    if (!authed) return (
        <>
            <style>{globalCss}</style>
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg, padding: 24 }}>
                <div className="scale-in" style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.border}`, padding: 36, width: '100%', maxWidth: 380 }}>
                    <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 34, color: theme.accent, letterSpacing: 3, marginBottom: 4 }}>PANEL DEL DUEÑO</h1>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', fontSize: 15, marginBottom: 10, border: `1px solid ${theme.border}` }}
                        placeholder="Correo" autoFocus />
                    <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && attempt()}
                        style={{ width: '100%', padding: '12px 16px', fontSize: 15, marginBottom: 10, border: `1px solid ${loginErr ? theme.red : theme.border}` }}
                        placeholder="Contraseña" />
                    {loginErr && <p style={{ color: theme.red, fontSize: 12, marginBottom: 8 }}>{loginErr}</p>}
                    <button disabled={loginLoading} onClick={attempt}
                        style={{ width: '100%', padding: 14, borderRadius: 10, background: loginLoading ? theme.border : theme.accent, color: 'white', fontWeight: 700, fontSize: 15 }}>
                        {loginLoading ? 'Validando...' : 'Entrar'}
                    </button>
                </div>
            </div>
        </>
    )

    if (!ownerAllowed) return (
        <>
            <style>{globalCss}</style>
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg, padding: 24 }}>
                <div className="scale-in" style={{ background: theme.card, borderRadius: 18, border: `1px solid ${theme.border}`, padding: 36, width: '100%', maxWidth: 430, textAlign: 'center' }}>
                    <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: theme.red, letterSpacing: 3, marginBottom: 10 }}>ACCESO DENEGADO</h1>
                    <p style={{ color: theme.muted, fontSize: 14, marginBottom: 20 }}>Esta sección es exclusiva para el dueño.</p>
                    <button onClick={handleLogout} style={{ padding: '10px 16px', borderRadius: 10, background: theme.accent, color: 'white', fontWeight: 700, border: 'none' }}>
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </>
    )

    // ── Dashboard ──────────────────────────────────────────────────────────────
    return (
        <>
            <style>{globalCss}</style>
            <div style={{ background: theme.bg, minHeight: '100vh', padding: '20px 16px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 38, color: theme.accent, letterSpacing: 3, lineHeight: 1 }}>PANEL DEL DUEÑO</h1>
                        <p style={{ color: theme.muted, fontSize: 13 }}>{session?.user?.email || ''}</p>
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
                        {/* ── RESUMEN ──────────────────────────────────────────────── */}
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

                        {/* ── HISTORIAL ────────────────────────────────────────────── */}
                        {tab === 'historial' && (
                            <div className="fade-in">
                                {/* Filtros */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes'], ['ano', 'Año']].map(([m, l]) => (
                                        <button key={m} onClick={() => setFilterMode(m)} style={{
                                            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                            background: filterMode === m ? theme.accentDim : theme.card,
                                            color: filterMode === m ? theme.accent : theme.muted,
                                            border: `1px solid ${filterMode === m ? theme.accent : theme.border}`,
                                        }}>{l}</button>
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
                                            {/* Muestra imagen o emoji según el tipo */}
                                            <div style={{ width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surface, borderRadius: 10, overflow: 'hidden' }}>
                                                {isUrl(p.photo) ? (
                                                    <img src={p.photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: 26 }}>{p.photo}</span>
                                                )}
                                            </div>
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
