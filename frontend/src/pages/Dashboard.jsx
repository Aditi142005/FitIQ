import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";

function Dashboard() {

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };


  return (
    <div className="min-h-screen bg-background p-8">

  <div className="flex justify-between items-center">

    <h1 className="text-3xl font-heading font-bold text-primary">
      FitIQ 🧡
    </h1>

    <button
      onClick={handleLogout}
      className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-orange-700 transition"
    >
      Logout
    </button>

  </div>


  <div className="mt-20 text-center">

    <h1 className="text-5xl font-heading font-bold text-textPrimary">
      Welcome to FitIQ
    </h1>

    <p className="text-xl text-textSecondary mt-4">
      Your personalized fitness journey starts here.
    </p>

  </div>

</div>
  );
}

export default Dashboard;