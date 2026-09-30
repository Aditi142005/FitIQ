import { getUserDisplayName, getInitials } from "./ProfileSection";

function Sidebar({ setActivePage, activePage, profile, user }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "insights",  label: "AI Insights",    icon: "🧠" },
    { id: "analytics", label: "Analytics",  icon: "📊" },
    { id: "nutrition", label: "Nutrition",   icon: "🍎" },
    { id: "tracking",  label: "Daily Tracking", icon: "📅" },
    { id: "profile",   label: "Profile",    icon: "👤" },
  ];

  const sidebarName = getUserDisplayName(profile, user);

  return (
    <div className="w-64 min-h-screen bg-white shadow-card p-6 flex flex-col justify-between">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-10">
          FitIQ 🧡
        </h1>

        <nav className="space-y-2">
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

      {/* User profile snippet at bottom of sidebar */}
      {profile && (
        <div
          onClick={() => setActivePage("profile")}
          className={`pt-4 border-t border-gray-100 flex items-center gap-3 cursor-pointer p-2 rounded-xl transition ${
            activePage === "profile" ? "bg-orange-50/70" : "hover:bg-orange-50/40"
          }`}
          title="View Your Profile"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 text-white font-bold text-sm flex items-center justify-center shadow-sm flex-shrink-0">
            {getInitials(sidebarName)}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-textPrimary truncate">
              {sidebarName || "Your Profile"}
            </p>
            <p className="text-xs text-textSecondary truncate">
              {profile.goal || profile.fitnessGoal || "Member"}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default Sidebar;