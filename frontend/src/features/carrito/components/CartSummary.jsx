import { formatCurrency } from '../../../shared/utils/utils'

// muestra el total del carrito y botones de accion (vaciar carrito, finalizar compra)

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
            <p>Total: {formatCurrency(totalNumber)}</p>
            
            <div className="cart-summary-actions">
                <button
                    type="button"
                    className="btn ghost"
                    onClick={() => onVaciar?.()}
                    disabled={disabled || totalNumber <= 0}
                >
                    Vaciar carrito
                </button>
                <button
                    type="button"
                    className="btn"
                    onClick={() => onFinalizar?.()}
                    disabled={disabled || !canFinalize}
                >
                    Finalizar compra
                </button>
            </div>
        </section>
    );
}