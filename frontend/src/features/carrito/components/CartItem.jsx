import { useEffect, useRef, useState } from "react";

function formatPrice(value) {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    }).format(amount);
}

function resolveImageUrl(rawUrl) {
    if (!rawUrl) return null;
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    const cleanBase = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

    if (rawUrl.startsWith("/")) {
        return cleanBase ? `${cleanBase}${rawUrl}` : rawUrl;
    }

    return cleanBase ? `${cleanBase}/${rawUrl}` : `/${rawUrl}`;
}

// Muestra un item del carrito y botones para modificar cantidad o eliminarlo.
export function CartItem({ item, onRemove, onUpdate, disabled = false }) {
    if (!item) return null;

    const varianteId = Number(item.variante_id);
    const cantidad = Number(item.cantidad) || 0;
    const subtotal = Number(item.subtotal) || 0;
    const productoNombre = item.producto_nombre || `Producto #${item.producto_id || "-"}`;
    const medida = item.size_valor || item.Size || item.size || null;
    const imagen = resolveImageUrl(item.imagen_url);
    const canDecrease = !disabled && cantidad > 1;
    const canIncrease = !disabled;
    const canRemove = !disabled && typeof onRemove === "function";
    const previousCantidadRef = useRef(cantidad);
    const previousSubtotalRef = useRef(subtotal);
    const [cantidadUpdating, setCantidadUpdating] = useState(false);
    const [subtotalUpdating, setSubtotalUpdating] = useState(false);

    useEffect(() => {
        if (previousCantidadRef.current === cantidad) return undefined;

        previousCantidadRef.current = cantidad;
        setCantidadUpdating(true);

        const timer = setTimeout(() => {
            setCantidadUpdating(false);
        }, 360);

        return () => clearTimeout(timer);
    }, [cantidad]);

    useEffect(() => {
        if (previousSubtotalRef.current === subtotal) return undefined;

        previousSubtotalRef.current = subtotal;
        setSubtotalUpdating(true);

        const timer = setTimeout(() => {
            setSubtotalUpdating(false);
        }, 420);

        return () => clearTimeout(timer);
    }, [subtotal]);

    return (
        <article className="cart-item">
            <div className="cart-item-media">
                {imagen ? (
                    <img src={imagen} alt={productoNombre} className="cart-item-image" />
                ) : (
                    <div className="cart-item-image-placeholder">Sin imagen</div>
                )}
            </div>

            <div className="cart-item-info">
                <h3>{productoNombre}</h3>
                <p className="cart-item-variant">Variante #{Number.isFinite(varianteId) ? varianteId : item.variante_id}</p>
                <p className={`cart-item-meta cart-item-qty ${cantidadUpdating ? "is-updating" : ""}`}>
                    Cantidad: <span className="cart-item-qty-value">{cantidad}</span>
                </p>
                {medida ? <p className="cart-item-meta">Medida: {medida}</p> : null}
                <p className="cart-item-price">Precio unitario: {formatPrice(item.precio)}</p>
                <p className={`cart-item-subtotal ${subtotalUpdating ? "is-updating" : ""}`}>
                    Subtotal: {formatPrice(subtotal)}
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