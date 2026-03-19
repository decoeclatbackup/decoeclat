import { Routes, Route, Navigate } from 'react-router-dom'
import { ProductAdminPage, ProductCatalogPage, ProductDetailPage } from '../features/products/pages/pages'
import { CartPage } from '../features/carrito/pages/pages'

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. La vista del Admin */}
      <Route path="/admin/productos" element={<ProductAdminPage />} />

      {/* 2. La vista del Cliente (Catálogo General) */}
      <Route path="/catalogo" element={<ProductCatalogPage />} />
      
      {/* 3. Las 7 categorías (Ruta dinámica) */}
      <Route path="/categoria/:categoryId" element={<ProductCatalogPage />} />

      {/* 4. Detalle individual de producto */}
      <Route path="/producto/:productId" element={<ProductDetailPage />} />

      {/* 5. Carrito */}
      <Route path="/carrito" element={<CartPage />} />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate replace to="/catalogo" />} />
    </Routes>
  )
}