// componente que muestra el contenido del carrito, con la lista de productos,
//  cantidades, precios, etc. y botones para modificar el carrito (vaciar carrito, finalizar compra, etc)
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";

export function Cart({
    carrito,
    loading = false,
    error = null,
    handleEliminarItem,
    handleUpdateCantidad,
    handleVaciarCarrito,
    handleFinalizarCompra,
}) {
    const items = Array.isArray(carrito?.items) ? carrito.items : [];
    const total = Number(carrito?.total) || 0;
    const errorMessage = typeof error === "string" ? error : error?.message;

    if (loading && items.length === 0) {
        return <p>Cargando carrito...</p>;
    }

    if (errorMessage) {
        return <p className="cart-error">{errorMessage}</p>;
    }

    if (items.length === 0) {
        return <p>Tu carrito esta vacio.</p>;
    }

    return (
        <section className="cart">
            <div className="cart-items">
                {items.map((item) => (
                    <CartItem
                        key={item.item_id || item.variante_id}
                        item={item}
                        onRemove={handleEliminarItem}
                        onUpdate={handleUpdateCantidad}
                        disabled={loading}
                    />
                ))}
            </div>

            <CartSummary
                total={total}
                onVaciar={handleVaciarCarrito}
                onFinalizar={handleFinalizarCompra}
                disabled={loading}
                canFinalize={items.length > 0}
            />
        </section>
    );
}