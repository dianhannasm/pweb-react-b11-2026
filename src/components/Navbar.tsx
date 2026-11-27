export type NavPage =
  | "explorer"
  | "pipeline"
  | "dashboard";

interface NavbarProps {
  active: NavPage;
  onNavigate: (page: NavPage) => void;
}

export function Navbar({ active, onNavigate }: NavbarProps) {
  const items: Array<{ page: NavPage; label: string }> = [
    { page: "explorer", label: "Eksplorasi Lowongan" },
    { page: "pipeline", label: "War Room Pipeline" },
    { page: "dashboard", label: "Dashboard & Offer" },
  ];

  return (
    <nav className="top-nav" aria-label="Navigasi aplikasi">
      <button
        type="button"
        className="top-nav-brand"
        onClick={() => onNavigate("explorer")}
      >
        Aku Mw Magang
      </button>

      <div className="top-nav-links">
        {items.map((item) => (
          <button
            key={item.page}
            type="button"
            className={`top-nav-link ${active === item.page ? "active" : ""}`}
            onClick={() => onNavigate(item.page)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
