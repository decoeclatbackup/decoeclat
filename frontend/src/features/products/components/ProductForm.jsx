const initialFieldErrors = {
  name: '',
  categoryId: '',
  sizeId: '',
  telaId: '',
  precio: '',
}

function validate(form) {
  const errors = { ...initialFieldErrors }

  if (!form.name.trim()) errors.name = 'El nombre es obligatorio'
  if (!form.categoryId) errors.categoryId = 'La categoria es obligatoria'
  if (!form.sizeId) errors.sizeId = 'El talle es obligatorio'
  if (!form.telaId) errors.telaId = 'El color (tela ID) es obligatorio'
  if (!form.precio || Number(form.precio) <= 0) {
    errors.precio = 'El precio debe ser mayor a 0'
  }

  return errors
}

export function ProductForm({ form, isEditing, onChange, onSubmit, onCancel }) {
  const errors = validate(form)
  const hasErrors = Object.values(errors).some(Boolean)

  return (
    <section className="card">
      <h2>{isEditing ? 'Modificar Producto (RD)' : 'Registrar Producto (RD)'}</h2>

      <form
        className="grid three"
        onSubmit={(event) => {
          event.preventDefault()
          if (!hasErrors) onSubmit()
        }}
      >
        <label className="field">
          <span>Nombre</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Ej: Sillon Oslo"
            required
          />
          {errors.name ? <small className="error">{errors.name}</small> : null}
        </label>

        <label className="field">
          <span>Categoria ID</span>
          <input
            type="number"
            min="1"
            name="categoryId"
            value={form.categoryId}
            onChange={onChange}
            placeholder="Ej: 2"
            required
          />
          {errors.categoryId ? <small className="error">{errors.categoryId}</small> : null}
        </label>

        <label className="field">
          <span>Talle (size ID)</span>
          <input
            type="number"
            min="1"
            name="sizeId"
            value={form.sizeId}
            onChange={onChange}
            placeholder="Ej: 3"
            required
          />
          {errors.sizeId ? <small className="error">{errors.sizeId}</small> : null}
        </label>

        <label className="field">
          <span>Color (tela ID)</span>
          <input
            type="number"
            min="1"
            name="telaId"
            value={form.telaId}
            onChange={onChange}
            placeholder="Ej: 1"
            required
          />
          {errors.telaId ? <small className="error">{errors.telaId}</small> : null}
        </label>

        <label className="field">
          <span>Precio</span>
          <input
            type="number"
            min="0"
            step="0.01"
            name="precio"
            value={form.precio}
            onChange={onChange}
            placeholder="Ej: 149999.99"
            required
          />
          {errors.precio ? <small className="error">{errors.precio}</small> : null}
        </label>

        <label className="field">
          <span>Descripcion</span>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Opcional"
          />
        </label>

        <div className="actions full-width">
          <button type="submit" className="btn" disabled={hasErrors}>
            {isEditing ? 'Guardar cambios' : 'Registrar'}
          </button>
          {isEditing ? (
            <button type="button" className="btn ghost" onClick={onCancel}>
              Cancelar edicion
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
