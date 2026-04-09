import { useEffect, useState } from 'react'
import { formatCurrency } from '../../../shared/utils/utils'
import { resolveAssetUrl } from '../../../shared/utils/apiBaseUrl'

function resolveImageUrl(rawUrl) {
    if (!rawUrl) return null;
    const trimmedUrl = String(rawUrl).trim()
    if (!trimmedUrl) return null

    if (/^https?:\/\//i.test(trimmedUrl)) {
        return trimmedUrl.replace('://res.cloudinar.', '://res.cloudinary.')
    }

    if (trimmedUrl.startsWith('//')) {
        return `https:${trimmedUrl}`
    }

    const normalizedPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
    return resolveAssetUrl(normalizedPath)
}

// Muestra un item del carrito y botones para modificar cantidad o eliminarlo.
export function CartItem({ item, onRemove, onUpdate, disabled = false }) {
    const safeItem = item || {};

    const varianteId = Number(safeItem.variante_id);
    const cantidad = Number(safeItem.cantidad) || 0;
    const subtotal = Number(safeItem.subtotal) || 0;
    const productoNombre = safeItem.producto_nombre || `Producto #${safeItem.producto_id || "-"}`;
    const medida = safeItem.size_valor || safeItem.Size || safeItem.size || null;
    const imagen = resolveImageUrl(safeItem.imagen_url);
    const [imageLoadError, setImageLoadError] = useState(false)
    const canDecrease = !disabled && cantidad > 1;
    const canIncrease = !disabled;
    const canRemove = !disabled && typeof onRemove === "function";

    useEffect(() => {
        setImageLoadError(false)
    }, [imagen])

    if (!item) return null;

    return (
        <article className="cart-item">
            <div className="cart-item-media">
                {imagen && !imageLoadError ? (
                    <img
                        src={imagen}
                        alt={productoNombre}
                        className="cart-item-image"
                        onError={() => setImageLoadError(true)}
                    />
                ) : (
                    <div className="cart-item-image-placeholder">Sin imagen</div>
                )}
            </div>

            <div className="cart-item-info">
                <h3>{productoNombre}</h3>
                <p className="cart-item-variant">Variante #{Number.isFinite(varianteId) ? varianteId : safeItem.variante_id}</p>
                <p className="cart-item-meta cart-item-qty">
                    Cantidad: <span key={`qty-${cantidad}`} className="cart-item-qty-value cart-item-value-animated">{cantidad}</span>
                </p>
                {medida ? <p className="cart-item-meta">Medida: {medida}</p> : null}
                <p className="cart-item-price">Precio unitario: {formatCurrency(safeItem.precio)}</p>
                <p className="cart-item-subtotal">
                    Subtotal: <span key={`subtotal-${subtotal}`} className="cart-item-value-animated">{formatCurrency(subtotal)}</span>
                </p>
            </div>

            <div className="cart-item-actions">
                <button
                    type="button"
                    className="btn danger tiny"
                    onClick={() => onRemove?.(varianteId)}
                    disabled={!canRemove}
                >
                    Eliminar
                </button>

                <button
                    type="button"
                    className="btn ghost tiny"
                    onClick={() => onUpdate?.(varianteId, cantidad - 1)}
                    disabled={!canDecrease}
                    aria-label={`Disminuir cantidad de variante ${varianteId}`}
                >
                    -
                </button>

                <button
                    type="button"
                    className="btn ghost tiny"
                    onClick={() => onUpdate?.(varianteId, cantidad + 1)}
                    disabled={!canIncrease}
                    aria-label={`Aumentar cantidad de variante ${varianteId}`}
                >
                    +
                </button>
            </div>
        </article>
    );
}