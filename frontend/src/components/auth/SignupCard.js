import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signup } from "../../services/authService";
import { createUserProfile } from "../../services/firestoreService";
import Input from "../common/Input";
import Button from "../common/Button";

function SignupCard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Full Name is required.";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      // 1. Create account & immediately send email verification link via Firebase Auth
      const userCredential = await signup(email.trim(), password, name.trim());

      // 2. Save user profile to Firestore (never storing passwords)
      await createUserProfile(userCredential.user.uid, {
        name: name.trim(),
        email: email.trim()
      });

      // 3. DO NOT directly give access to dashboard/profile-setup!
      // Navigate to the verification screen
      navigate("/verify-email", {
        replace: true,
        state: {
          email: email.trim(),
          name: name.trim()
        }
      });
    } catch (error) {
      setLoading(false);
      if (error.code === "auth/email-already-in-use") {
        setGeneralError("An account with this email already exists. Please sign in instead.");
      } else if (error.code === "auth/invalid-email") {
        setGeneralError("The email address is invalid.");
      } else if (error.code === "auth/weak-password") {
        setGeneralError("Password is too weak. Please use a stronger password.");
      } else {
        setGeneralError(error.message || "Failed to create account. Please try again.");
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8 sm:p-10 border border-white/40">
      <h1 className="text-3xl font-heading font-bold text-textPrimary mb-2">
        Create your FitIQ Account 🧡
      </h1>

      <p className="text-textSecondary mb-6 text-sm">
        Start your personalized fitness journey today.
      </p>

      {generalError && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">⚠️</span>
          <span>{generalError}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSignup} noValidate>
        <Input
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          error={errors.name}
          disabled={loading}
          autoComplete="name"
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
          }}
          error={errors.email}
          disabled={loading}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a password (min. 6 chars)"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
          }}
          error={errors.password}
          disabled={loading}
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          error={errors.confirmPassword}
          disabled={loading}
          autoComplete="new-password"
        />

        <div className="pt-2">
          <Button disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </div>
      </form>

      <p className="text-center mt-6 text-sm text-textSecondary">
        Already have an account?{" "}
        <Link to="/" className="text-primary font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default SignupCard;