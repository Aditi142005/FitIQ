import { Link } from "react-router-dom";

import Input from "../common/Input";
import Button from "../common/Button";

function SignupCard() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-8">

      <h1 className="text-3xl font-heading font-bold text-textPrimary mb-2">
        Create your FitIQ Account 🧡
      </h1>

      <p className="text-textSecondary mb-8">
        Start your personalized fitness journey today.
      </p>

      <form className="space-y-5">

        <Input
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
        />

        <Button>
          Create Account
        </Button>

      </form>

      <p className="text-center mt-6">

        Already have an account?{" "}

        <Link
          to="/"
          className="text-primary font-semibold"
        >
          Sign In
        </Link>

      </p>

    </div>
  );
}

export default SignupCard;