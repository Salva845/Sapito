// src/App.jsx
// ─── Instala: npm install react-router-dom ────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import KitchenPage from './pages/KitchenPage'
import OwnerPage from './pages/OwnerPage'
import GenerateQRs from './pages/GenerateQRs'
import TableSelectionPage from './pages/TableSelectionPage'
import InvalidQrPage from './pages/InvalidQrPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Cliente: /menu?mesa=N  (el QR apunta aquí) */}
        <Route path="/menu" element={<MenuPage />} />

        {/* Cocina: tablet del restaurante */}
        <Route path="/cocina" element={<KitchenPage />} />

        {/* Dueño: panel privado con login */}
        <Route path="/dueno" element={<OwnerPage />} />

        {/* Utilidad: genera e imprime los QR de cada mesa */}
        <Route path="/qr" element={<GenerateQRs />} />

        {/* Pantalla informativa para clientes sin mesa/URL incorrecta */}
        <Route path="/inicio" element={<TableSelectionPage />} />
        <Route path="/qr-invalido" element={<InvalidQrPage />} />

        {/* Fallback global */}
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
