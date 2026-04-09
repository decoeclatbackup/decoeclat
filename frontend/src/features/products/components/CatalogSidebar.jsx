import { useEffect, useRef, useState } from 'react'

const PRODUCT_COLOR_HEX = {
  Beige: '#d8c3a5',
  Arena: '#c2b280',
  Avellana: '#8b6f47',
  Khaki: '#bdb76b',
  Blanco: '#f7f7f2',
  Negro: '#1f1f1f',
  'Gris Perla': '#d9d9d9',
  'Gris Aero': '#9aa8b0',
  'Gris Acero': '#6e7b82',
  Verde: '#6b8f71',
  Rosa: '#d89ca4',
  Canela: '#8b5a3c',
  Amarillo: '#e7c84b',
  Chocolate: '#5a3a29',
}

export function CatalogSidebar({
  filters,
  sizes,
  telas,
  colors = [],
  isFundasCategory,
  isMobileFiltersOpen,
  onToggleMobileFilters,
  onCloseMobileFilters,
  onFilterChange,
}) {
  const [openTab, setOpenTab] = useState('')
  const sidebarRef = useRef(null)

  function getSelectedValues(name) {
    const rawValue = filters?.[name]
    if (Array.isArray(rawValue)) return rawValue.map(String)
    if (rawValue == null || rawValue === '') return []
    return String(rawValue).split(',').map((value) => value.trim()).filter(Boolean)
  }

  function applyFilter(name, value) {
    if (name === 'sizeId' || name === 'telaId' || name === 'color') {
      const currentValues = getSelectedValues(name)
      const nextValues = value === ''
        ? []
        : currentValues.includes(String(value))
          ? currentValues.filter((currentValue) => currentValue !== String(value))
          : [...currentValues, String(value)]

      onFilterChange({
        target: {
          name,
          value: nextValues,
        },
      })
      return
    }

    onFilterChange({
      target: {
        name,
        value,
      },
    })
  }

  function toggleTab(tabName) {
    setOpenTab((current) => (current === tabName ? '' : tabName))
  }

  useEffect(() => {
    function handleOutsideInteraction(event) {
      if (!sidebarRef.current) return
      if (sidebarRef.current.contains(event.target)) return
      setOpenTab('')
      onCloseMobileFilters?.()
    }

    document.addEventListener('mousedown', handleOutsideInteraction)
    document.addEventListener('touchstart', handleOutsideInteraction)

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction)
      document.removeEventListener('touchstart', handleOutsideInteraction)
    }
  }, [onCloseMobileFilters])

  const selectedSizeIds = getSelectedValues('sizeId')
  const selectedTelaIds = getSelectedValues('telaId')
  const selectedColors = getSelectedValues('color')
  const hasSizeFilter = selectedSizeIds.length > 0
  const hasTelaFilter = selectedTelaIds.length > 0
  const hasColorFilter = selectedColors.length > 0

  return (
    <div className={`catalog-sidebar ${isMobileFiltersOpen ? 'mobile-filters-open' : 'mobile-filters-closed'}`} ref={sidebarRef}>
      <div className="catalog-filter-topline">
        <button
          type="button"
          className="catalog-filter-toggle-button"
          aria-label={isMobileFiltersOpen ? 'Cerrar filtros' : 'Abrir filtros'}
          aria-expanded={isMobileFiltersOpen}
          onClick={onToggleMobileFilters}
        >
          <svg viewBox="0 0 24 24" className="catalog-filter-toggle-icon" focusable="false" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="catalog-filter-tabs">
          {isFundasCategory ? (
            <details className="catalog-filter-tab" open={openTab === 'size'}>
              <summary
                className={`catalog-filter-tab-trigger ${hasSizeFilter ? 'active' : ''}`}
                onClick={(event) => {
                  event.preventDefault()
                  toggleTab('size')
                }}
              >
                <span>Medidas</span>
                <span className="catalog-filter-tab-chevron" aria-hidden="true">▾</span>
              </summary>
              <div className="catalog-filter-panel">
                <div className="catalog-filter-buttons">
                  <button
                    type="button"
                    className={`catalog-filter-btn ${selectedSizeIds.length === 0 ? 'active' : ''}`}
                    onClick={() => applyFilter('sizeId', '')}
                  >
                    Todos
                  </button>
                  {sizes.map((size) => (
                    <button
                      key={size.size_id}
                      type="button"
                      className={`catalog-filter-btn ${selectedSizeIds.includes(String(size.size_id)) ? 'active' : ''}`}
                      onClick={() => applyFilter('sizeId', String(size.size_id))}
                    >
                      {size.valor}
                    </button>
                  ))}
                </div>
              </div>
            </details>
          ) : null}

          <details className="catalog-filter-tab" open={openTab === 'design'}>
            <summary
              className={`catalog-filter-tab-trigger ${hasTelaFilter ? 'active' : ''}`}
              onClick={(event) => {
                event.preventDefault()
                toggleTab('design')
              }}
            >
              <span>Diseño</span>
              <span className="catalog-filter-tab-chevron" aria-hidden="true">▾</span>
            </summary>
            <div className="catalog-filter-panel">
              <div className="catalog-filter-buttons">
                <button
                  type="button"
                  className={`catalog-filter-btn ${selectedTelaIds.length === 0 ? 'active' : ''}`}
                  onClick={() => applyFilter('telaId', '')}
                >
                  Todas
                </button>
                {telas.map((tela) => (
                  <button
                    key={tela.tela_id}
                    type="button"
                    className={`catalog-filter-btn ${selectedTelaIds.includes(String(tela.tela_id)) ? 'active' : ''}`}
                    onClick={() => applyFilter('telaId', String(tela.tela_id))}
                  >
                    {tela.nombre}
                  </button>
                ))}
              </div>
            </div>
          </details>

          <details className="catalog-filter-tab" open={openTab === 'color'}>
            <summary
              className={`catalog-filter-tab-trigger ${hasColorFilter ? 'active' : ''}`}
              onClick={(event) => {
                event.preventDefault()
                toggleTab('color')
              }}
            >
              <span>Color</span>
              <span className="catalog-filter-tab-chevron" aria-hidden="true">▾</span>
            </summary>
            <div className="catalog-filter-panel catalog-filter-panel-color">
              <div className="catalog-filter-buttons catalog-filter-buttons-color">
                <button
                  type="button"
                  className={`catalog-filter-btn catalog-filter-btn-color-all ${selectedColors.length === 0 ? 'active' : ''}`}
                  onClick={() => applyFilter('color', '')}
                >
                  Todos
                </button>
                {colors.map((colorName) => (
                  <button
                    key={colorName}
                    type="button"
                    className={`catalog-filter-btn catalog-filter-btn-color ${selectedColors.includes(String(colorName)) ? 'active' : ''}`}
                    onClick={() => applyFilter('color', String(colorName))}
                  >
                    <span
                      className="catalog-color-swatch"
                      style={{ backgroundColor: PRODUCT_COLOR_HEX[colorName] || '#cccccc' }}
                      aria-hidden="true"
                    />
                    <span>{colorName}</span>
                  </button>
                ))}
              </div>
            </div>
          </details>

        </div>
      </div>
    </div>
  )
}
