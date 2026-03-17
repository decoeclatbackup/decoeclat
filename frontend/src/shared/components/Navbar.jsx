import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'

function buildCategoryTree(categories) {
	const items = Array.isArray(categories) ? categories : []
	const categoriesById = new Map(items.map((category) => [String(category.categoria_id), category]))

	const rootCategories = items.filter((category) => {
		if (category.parent_id == null) return true
		return !categoriesById.has(String(category.parent_id))
	})

	return rootCategories.map((category) => ({
		id: String(category.categoria_id),
		name: category.nombre,
		children: items
			.filter((child) => String(child.parent_id) === String(category.categoria_id))
			.map((child) => ({
				id: String(child.categoria_id),
				name: child.nombre,
			})),
	}))
}

export default function Navbar({
	categories,
	selectedCategoryId,
	searchValue,
	onSearchSubmit,
}) {
	const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])
	const [openCategoryId, setOpenCategoryId] = useState(null)
	const [draftSearchValue, setDraftSearchValue] = useState(searchValue || '')

	const selectedParentId = useMemo(() => {
		const selectedParent = categoryTree.find((category) =>
			category.children.some((child) => child.id === String(selectedCategoryId))
		)

		return selectedParent?.id || null
	}, [categoryTree, selectedCategoryId])

	function handleSubmit(event) {
		event.preventDefault()
		onSearchSubmit(draftSearchValue)
	}

	function toggleCategory(categoryId) {
		setOpenCategoryId((current) => (current === categoryId ? null : categoryId))
	}

	return (
		<nav className="catalog-navbar">
			<div className="catalog-navbar-links">
				<NavLink
					to="/catalogo"
					className={({ isActive }) => `catalog-nav-link ${isActive && !selectedCategoryId ? 'active' : ''}`}
				>
					Todos
				</NavLink>

				{categoryTree.map((category) => {
					const hasChildren = category.children.length > 0
					const isParentActive = String(selectedCategoryId) === category.id
					const isChildActive = category.children.some((child) => child.id === String(selectedCategoryId))
					const isOpen = openCategoryId === category.id || (openCategoryId == null && selectedParentId === category.id) || isChildActive

					if (!hasChildren) {
						return (
							<NavLink
								key={category.id}
								to={`/categoria/${category.id}`}
								className={() => `catalog-nav-link ${isParentActive ? 'active' : ''}`}
							>
								{category.name}
							</NavLink>
						)
					}

					return (
						<div
							key={category.id}
							className={`catalog-nav-group ${isOpen ? 'open' : ''}`}
						>
							<div className="catalog-nav-parent-row">
								<NavLink
									to={`/categoria/${category.id}`}
									className={() => `catalog-nav-link ${isParentActive || isChildActive ? 'active' : ''}`}
								>
									{category.name}
								</NavLink>
								<button
									type="button"
									className="catalog-nav-toggle"
									onClick={() => toggleCategory(category.id)}
									aria-expanded={isOpen}
									aria-label={`Mostrar subcategorias de ${category.name}`}
								>
									▾
								</button>
							</div>

							<div className="catalog-submenu">
								{category.children.map((child) => (
									<NavLink
										key={child.id}
										to={`/categoria/${child.id}`}
										className={() => `catalog-submenu-link ${String(selectedCategoryId) === child.id ? 'active' : ''}`}
									>
										{child.name}
									</NavLink>
								))}
							</div>
						</div>
					)
				})}
			</div>

			<form className="catalog-navbar-search" onSubmit={handleSubmit}>
				<div className="catalog-search-field">
					<input
						type="search"
						name="name"
						value={draftSearchValue}
						onChange={(event) => setDraftSearchValue(event.target.value)}
						placeholder="Buscar productos"
						aria-label="Buscar productos"
					/>
					<button type="submit" className="catalog-search-submit" aria-label="Buscar">
						<svg viewBox="0 0 24 24" aria-hidden="true" className="catalog-search-icon">
							<path
								d="M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13Zm0 1.8a4.7 4.7 0 1 1 0 9.4a4.7 4.7 0 0 1 0-9.4Zm5.54 10.97l3.43 3.43a.9.9 0 1 1-1.27 1.27l-3.43-3.43a.9.9 0 0 1 1.27-1.27Z"
								fill="currentColor"
							/>
						</svg>
					</button>
				</div>
			</form>
		</nav>
	)
}