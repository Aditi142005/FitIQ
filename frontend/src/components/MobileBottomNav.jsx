/**
 * MobileBottomNav — shown only on screens ≤ 768px.
 * Provides quick access to the 5 most-used pages.
 * Desktop sidebar is hidden on mobile via CSS (.desktop-sidebar media query).
 */
function MobileBottomNav({ activePage, setActivePage }) {
  const navItems = [
    { id: "dashboard", label: "Home",      icon: "🏠" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "insights",  label: "Insights",  icon: "🧠" },
    { id: "nutrition", label: "Nutrition", icon: "🍎" },
    { id: "profile",   label: "Profile",   icon: "👤" },
  ];

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
      {navItems.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setActivePage(id)}
          aria-label={label}
          aria-current={activePage === id ? "page" : undefined}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            padding: "10px 4px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: activePage === id ? "#C65D3B" : "#9CA3AF",
            fontFamily: "Inter, sans-serif",
            fontSize: "10px",
            fontWeight: activePage === id ? "700" : "500",
            transition: "color 0.15s ease",
            minHeight: "56px",
          }}
        >
          <span style={{ fontSize: "20px", lineHeight: 1 }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default MobileBottomNav;
