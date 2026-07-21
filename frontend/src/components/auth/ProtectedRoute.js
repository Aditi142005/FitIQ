import { Navigate } from "react-router-dom";
import { auth } from "../../firebase/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";


function ProtectedRoute({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {

      setUser(currentUser);
      setLoading(false);

    });


    return () => unsubscribe();

  }, []);



  if (loading) {
    return <p>Loading...</p>;
  }


  if (!user) {
    return <Navigate to="/" />;
  }


  return children;

}


export default ProtectedRoute;