import { Routes, Route, Navigate } from 'react-router-dom'
import { ProductAdminPage, ProductCatalogPage } from '../features/products/pages/pages'

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. La vista del Admin */}
      <Route path="/admin/productos" element={<ProductAdminPage />} />

      {/* 2. La vista del Cliente (Catálogo General) */}
      <Route path="/catalogo" element={<ProductCatalogPage />} />
      
      {/* 3. Las 7 categorías (Ruta dinámica) */}
      <Route path="/categoria/:categoryId" element={<ProductCatalogPage />} />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate replace to="/catalogo" />} />
    </Routes>
  )
}