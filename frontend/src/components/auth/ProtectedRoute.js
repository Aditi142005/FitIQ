import { Navigate } from "react-router-dom";
import { auth } from "../../firebase/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        try {
          // Attempt reload to fetch the latest server verification status
          await currentUser.reload();
        } catch (e) {
          // Ignore reload network failures
        }
      }
      setUser(auth.currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-textSecondary text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Block unverified users from accessing any protected application pages
  if (!user.emailVerified) {
    return (
      <Navigate
        to="/verify-email"
        replace
        state={{
          email: user.email,
          message: "Please verify your email before continuing."
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;