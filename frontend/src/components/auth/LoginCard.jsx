import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { login, resendVerificationEmail } from "../../services/authService";
import { getUserProfile } from "../../services/firestoreService";
import { motion } from "framer-motion";
import Input from "../common/Input";
import Button from "../common/Button";

function LoginCard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setResendSuccess("");
    setUnverifiedUser(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      // 1. Authenticate with Firebase
      const userCredential = await login(email.trim(), password);
      const user = userCredential.user;

      // 2. Check email verification status
      if (!user.emailVerified) {
        // Block access to protected pages!
        setUnverifiedUser(user);
        setError("Please verify your email before continuing.");
        setLoading(false);
        return;
      }

      // 3. User is verified -> proceed to existing authenticated pages
      const profile = await getUserProfile(user.uid);
      if (profile && profile.age && profile.gender) {
        navigate("/dashboard");
      } else {
        navigate("/profile-setup");
      }
    } catch (err) {
      setLoading(false);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password. Please check your credentials.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !unverifiedUser) return;
    setError("");
    setResendSuccess("");
    setResending(true);

    try {
      await resendVerificationEmail(unverifiedUser);
      setResendSuccess("Verification email resent! Please check your inbox and spam folder.");
      setCooldown(60);
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a minute before requesting another email.");
      } else {
        setError(err.message || "Could not resend verification email.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="
        w-full 
        max-w-md 
        bg-white/80 
        backdrop-blur-lg
        rounded-3xl 
        shadow-card 
        p-8 
        sm:p-10
        border
        border-white/40
      "
    >
      <h1 className="text-3xl font-heading font-bold text-textPrimary mb-2">
        Welcome to FitIQ 🧡
      </h1>

      <p className="text-textSecondary mb-6 text-sm">
        Sign in to continue your fitness journey.
      </p>

      {/* Unverified Email Warning Banner */}
      {unverifiedUser ? (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm">
          <div className="flex items-start gap-2.5 mb-2">
            <span className="text-lg leading-none">✉️</span>
            <div>
              <p className="font-bold text-amber-950">Email Verification Required</p>
              <p className="mt-0.5 text-xs text-amber-800">
                Please verify your email address before continuing. A verification link was sent to:
              </p>
              <p className="mt-1 font-semibold text-xs text-textPrimary bg-white/70 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-block break-all">
                {unverifiedUser.email}
              </p>
            </div>
          </div>

          <p className="text-xs text-amber-700 mb-3 ml-7">
            💡 Check your <strong>Inbox and Spam/Junk folder</strong>.
          </p>

          {resendSuccess && (
            <p className="mb-3 text-xs text-green-700 bg-green-100/60 border border-green-200 p-2 rounded-lg font-medium">
              ✅ {resendSuccess}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-[#B34E2D] disabled:opacity-50 transition-colors shadow-sm"
            >
              {resending
                ? "Sending Link..."
                : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : "Resend Verification Email"}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/verify-email", {
                  state: { email: unverifiedUser.email }
                })
              }
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-white text-primary border border-primary/30 hover:bg-orange-50 transition-colors"
            >
              Go to Verification Screen →
            </button>
          </div>
        </div>
      ) : error ? (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleLogin} noValidate>
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
            if (unverifiedUser) setUnverifiedUser(null);
          }}
          disabled={loading}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
            if (unverifiedUser) setUnverifiedUser(null);
          }}
          disabled={loading}
          autoComplete="current-password"
        />

        <div className="flex justify-between items-center text-sm pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-textSecondary text-xs">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Remember Me
          </label>

          <Link
            to="/forgot-password"
            className="text-primary hover:underline text-xs font-medium"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="pt-2">
          <Button disabled={loading}>
            {loading ? "Signing in..." : "Continue"}
          </Button>
        </div>
      </form>

      <p className="text-center mt-6 text-sm text-textSecondary">
        Don't have an account?{" "}
        <Link to="/signup" className="text-primary font-semibold hover:underline">
          Create Account
        </Link>
      </p>
    </motion.div>
  );
}

export default LoginCard;