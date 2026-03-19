function formatPrice(value) {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    }).format(amount);
}

// Muestra un item del carrito y botones para modificar cantidad o eliminarlo.
export function CartItem({ item, onRemove, onUpdate, disabled = false }) {
    if (!item) return null;

    const varianteId = Number(item.variante_id);
    const cantidad = Number(item.cantidad) || 0;
    const canDecrease = !disabled && cantidad > 1;
    const canIncrease = !disabled;
    const canRemove = !disabled && typeof onRemove === "function";

    return (
        <article className="cart-item">
            <div className="cart-item-info">
                <h3>Variante #{Number.isFinite(varianteId) ? varianteId : item.variante_id}</h3>
                <p>Cantidad: {cantidad}</p>
                <p>Precio unitario: {formatPrice(item.precio)}</p>
                <p>Subtotal: {formatPrice(item.subtotal)}</p>
            </div>

            <div className="cart-item-actions">
                <button
                    type="button"
                    onClick={() => onRemove?.(varianteId)}
                    disabled={!canRemove}
                >
                    Eliminar
                </button>

                <button
                    type="button"
                    onClick={() => onUpdate?.(varianteId, cantidad - 1)}
                    disabled={!canDecrease}
                    aria-label={`Disminuir cantidad de variante ${varianteId}`}
                >
                    -
                </button>

                <button
                    type="button"
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