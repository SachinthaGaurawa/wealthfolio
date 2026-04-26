export default function Sidebar({ setTab }) {
  return (
    <div className="sidebar">
      <h2>WealthFolio</h2>
      {[
        "dashboard",
        "income",
        "expenses",
        "loans",
        "cards",
        "investments",
        "targets"
      ].map((t) => (
        <button key={t} onClick={() => setTab(t)}>
          {t.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
