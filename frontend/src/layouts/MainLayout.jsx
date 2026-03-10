export function MainLayout({ title, subtitle, children }) {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="kicker">DECO ECLAT</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>
      <section className="content">{children}</section>
    </main>
  )
}
