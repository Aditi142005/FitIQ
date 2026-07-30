function Sidebar({ setActivePage }) {
  return (
    <div className="w-64 min-h-screen bg-white shadow-card p-6">

      <h1 className="text-3xl font-bold text-primary mb-10">
        FitIQ 🧡
      </h1>

      <nav className="space-y-4">

        <button
  onClick={() => setActivePage("dashboard")}
  className="w-full text-left p-3 rounded-xl hover:bg-orange-100"
>
  🏠 Dashboard
</button>

       <button
  onClick={() => setActivePage("analytics")}
  className="w-full text-left p-3 rounded-xl hover:bg-orange-100"
>
  📊 Analytics
</button>

       <button
  onClick={() => setActivePage("nutrition")}
  className="w-full text-left p-3 rounded-xl hover:bg-orange-100"
>
  🍎 Nutrition
</button>

        <button
  onClick={() => setActivePage("workout")}
  className="w-full text-left p-3 rounded-xl hover:bg-orange-100"
>
  💪 Workout
</button>

        <button
  onClick={() => setActivePage("recommendations")}
  className="w-full text-left p-3 rounded-xl hover:bg-orange-100"
>
  🎯 Recommendations
</button>

        <button
  onClick={() => setActivePage("profile")}
  className="w-full text-left p-3 rounded-xl hover:bg-orange-100"
>
  👤 Profile
</button>

      </nav>

    </div>
  );
}

export default Sidebar;