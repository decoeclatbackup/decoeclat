// muestra el total del carrito y botones de accion (vaciar carrito, finalizar compra)
function formatPrice(value) {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    }).format(amount);
}

export function CartSummary({
    total,
    onVaciar,
    onFinalizar,
    disabled = false,
    canFinalize = true,
}) {
    const totalNumber = Number(total) || 0;

    return (
        <section className="cart-summary">
            <h2>Resumen del carrito</h2>
            <p>Total: {formatPrice(totalNumber)}</p>
            
            <div className="cart-summary-actions">
                <button
                    type="button"
                    onClick={() => onVaciar?.()}
                    disabled={disabled || totalNumber <= 0}
                >
                    Vaciar carrito
                </button>
                <button
                    type="button"
                    onClick={() => onFinalizar?.()}
                    disabled={disabled || !canFinalize}
                >
                    Finalizar compra
                </button>
            </div>
        </section>
    );
}