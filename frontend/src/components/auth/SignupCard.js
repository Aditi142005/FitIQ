import { Link } from "react-router-dom";
import { useState } from "react";
import { signup } from "../../services/authService";
import Input from "../common/Input";
import Button from "../common/Button";
import { createUserProfile } from "../../services/firestoreService";
function SignupCard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const handleSignup = async (e) => {
  e.preventDefault();

  try {
    const userCredential = await signup(email, password);

    await createUserProfile(
      userCredential.user.uid,
      name,
      email
    );

    alert("Account created successfully!");

  } catch (error) {
    alert(error.message);
  }
};
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-8">

      <h1 className="text-3xl font-heading font-bold text-textPrimary mb-2">
        Create your FitIQ Account 🧡
      </h1>

      <p className="text-textSecondary mb-8">
        Start your personalized fitness journey today.
      </p>

      <form 
  className="space-y-5"
  onSubmit={handleSignup}
>

        <Input
  label="Full Name"
  type="text"
  placeholder="Enter your full name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

        <Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

        <Input
  label="Password"
  type="password"
  placeholder="Create a password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
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