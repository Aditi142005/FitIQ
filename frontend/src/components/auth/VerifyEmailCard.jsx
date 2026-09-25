import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../../firebase/firebase";
import { checkEmailVerified, resendVerificationEmail, logout } from "../../services/authService";
import { getUserProfile } from "../../services/firestoreService";
import Button from "../common/Button";

function VerifyEmailCard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    location.state?.email || auth.currentUser?.email || ""
  );
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    location.state?.message || ""
  );
  const [cooldown, setCooldown] = useState(0);

  // Sync current user email if auth state initializes after mount
  useEffect(() => {
    if (!email && auth.currentUser?.email) {
      setEmail(auth.currentUser.email);
    }
  }, [email]);

  // Handle countdown timer for resending verification email
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle "I've Verified My Email / Continue" button
  const handleContinue = async () => {
    setError("");
    setSuccess("");
    setChecking(true);

    try {
      const isVerified = await checkEmailVerified();

      if (isVerified) {
        // Proceed according to existing authentication architecture
        const user = auth.currentUser;
        if (user) {
          const profile = await getUserProfile(user.uid);
          if (profile && profile.age && profile.gender) {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/profile-setup", { replace: true });
          }
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        // Exact requirement: "Please verify your email before continuing."
        setError("Please verify your email before continuing.");
      }
    } catch (err) {
      setError(err.message || "Failed to check verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  // Handle "Resend Verification Email" button
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setSuccess("");
    setResending(true);

    try {
      await resendVerificationEmail();
      setSuccess("A new verification link has been sent to your email. Please check your inbox and spam folder.");
      setCooldown(60);
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a minute before requesting another email.");
      } else {
        setError(err.message || "Could not resend verification email. Please try signing in again.");
      }
    } finally {
      setResending(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    navigate("/", { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md bg-white rounded-3xl shadow-card p-8 sm:p-10 border border-white/40"
    >
      <div className="w-16 h-16 bg-orange-100/70 text-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-sm">
        ✉️
      </div>

      <h1 className="text-3xl font-heading font-bold text-textPrimary text-center mb-2">
        Verify Your Email
      </h1>

      <p className="text-textSecondary text-center text-sm mb-5 leading-relaxed">
        We've sent a verification link to your registered email address. Please click the link to activate your FitIQ account.
      </p>

      {/* Registered Email Display */}
      {email && (
        <div className="bg-[#FAF7F2] border border-orange-200/80 rounded-2xl p-3.5 mb-5 text-center shadow-inner">
          <p className="text-xs text-textSecondary uppercase tracking-wider font-semibold mb-1">
            Registered Email
          </p>
          <p className="text-sm font-bold text-textPrimary break-all">
            {email}
          </p>
        </div>
      )}

      {/* Inbox & Spam Notice */}
      <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 mb-5 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
        <span className="text-base leading-none">💡</span>
        <div>
          <span className="font-semibold">Check your Inbox and Spam/Junk folder.</span>
          <p className="mt-0.5 text-amber-800">
            If you do not see the email within 1–2 minutes, check your spam folder or request a new link below.
          </p>
        </div>
      </div>

      {/* Error Message Banner */}
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2 animate-shake">
          <span className="text-base leading-none mt-0.5">⚠️</span>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Success / Resend Notice Banner */}
      {success && !error && (
        <div className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">✅</span>
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-1">
        {/* Continue / Check Verification Button */}
        <Button
          type="button"
          onClick={handleContinue}
          disabled={checking}
        >
          {checking ? "Checking Verification..." : "I've Verified My Email / Continue"}
        </Button>

        {/* Resend Verification Email Button */}
        <Button
          type="button"
          variant="secondary"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
        >
          {resending 
            ? "Sending Link..." 
            : cooldown > 0 
            ? `Resend available in ${cooldown}s` 
            : "Resend Verification Email"}
        </Button>
      </div>

      <div className="text-center mt-6 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSwitchAccount}
          className="text-xs text-textSecondary hover:text-primary transition-colors font-medium inline-flex items-center gap-1"
        >
          ← Use a different account / Back to Sign In
        </button>
      </div>
    </motion.div>
  );
}

export default VerifyEmailCard;
