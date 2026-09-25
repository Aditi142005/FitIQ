function Sidebar({ setActivePage, activePage }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "insights",  label: "AI Insights",    icon: "🧠" },
    { id: "analytics", label: "Analytics",  icon: "📊" },
    { id: "nutrition", label: "Nutrition",   icon: "🍎" },
    { id: "tracking",  label: "Daily Tracking", icon: "📅" },
    { id: "profile",   label: "Profile",    icon: "👤" },
  ];

  return (
    <div className="w-64 min-h-screen bg-white shadow-card p-6 flex flex-col">

      <h1 className="text-3xl font-bold text-primary mb-10">
        FitIQ 🧡
      </h1>

      <nav className="space-y-2 flex-1">
        {navItems.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
              activePage === id
                ? "bg-primary text-white shadow-sm"
                : "text-textPrimary hover:bg-orange-50 hover:text-primary"
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}

export default Sidebar;