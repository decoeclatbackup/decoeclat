import { Routes, Route, Navigate } from 'react-router-dom'
import { ProductCatalogPage } from '../features/products/pages/ProductCatalogPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. La vista del Admin */}
      <Route path="/admin/productos" element={<ProductCatalogPage isClient={false} />} />

      {/* 2. La vista del Cliente (Catálogo General) */}
      <Route path="/catalogo" element={<ProductCatalogPage isClient={true} />} />
      
      {/* 3. Las 7 categorías (Ruta dinámica) */}
      <Route path="/categoria/:categoryId" element={<ProductCatalogPage isClient={true} />} />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate replace to="/catalogo" />} />
    </Routes>
  )
}