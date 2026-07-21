import { Link } from "react-router-dom";
import { useState } from "react";
import { resetPassword } from "../../services/authService";
import Input from "../common/Input";
import Button from "../common/Button";

function ForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const handleReset = async (e) => {
  e.preventDefault();

  try {
    await resetPassword(email);

    alert("Password reset email sent 📧");

  } catch (error) {
    alert(error.message);
  }
};
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-8">

      <h1 className="text-3xl font-heading font-bold text-textPrimary mb-2">
        Forgot Password?
      </h1>

      <p className="text-textSecondary mb-8">
        Enter your email and we'll send you a password reset link.
      </p>

      <form 
  className="space-y-5"
  onSubmit={handleReset}
>

       <Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e)=>setEmail(e.target.value)}
/>

        <Button>
          Send Reset Link
        </Button>

      </form>

      <p className="text-center mt-6">

        <Link
          to="/"
          className="text-primary font-semibold"
        >
          ← Back to Login
        </Link>

      </p>

    </div>
  );
}

export default ForgotPasswordCard;