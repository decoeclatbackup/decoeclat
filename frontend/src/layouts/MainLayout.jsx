export function MainLayout({navbar, children }) {
  return (
    <>
      {navbar ? <div className="app-topbar">{navbar}</div> : null}
      <main className="app-shell">
        <section className="content">{children}</section>
      </main>
    </>
  )
}
