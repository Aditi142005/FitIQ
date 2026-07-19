import { Link } from "react-router-dom";

function LoginCard() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-8">
      <h1 className="text-3xl font-heading font-bold text-textPrimary mb-2">
        Welcome Back
      </h1>

      <p className="text-textSecondary mb-8">
        Sign in to continue your fitness journey.
      </p>

      <form className="space-y-5">

        <div>
          <label className="block mb-2 font-medium">
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex justify-between items-center text-sm">

          <label className="flex items-center gap-2">

            <input type="checkbox" />

            Remember Me

          </label>

          <Link
            to="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot Password?
          </Link>

        </div>

        <button
          className="w-full bg-primary hover:bg-orange-700 text-white rounded-xl py-3 font-semibold transition"
        >
          Continue
        </button>

      </form>

      <p className="text-center mt-6">

        Don't have an account?{" "}

        <Link
          to="/signup"
          className="text-primary font-semibold"
        >
          Create Account
        </Link>

      </p>

    </div>
  );
}

export default LoginCard;