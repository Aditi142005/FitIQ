import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Input from "../common/Input";
import Button from "../common/Button";
function LoginCard() {
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
p-10
border
border-white/40
"
>
      <h1 className="text-3xl font-heading font-bold text-textPrimary mb-2">
         Welcome to FitIQ 🧡
      </h1>

      <p className="text-textSecondary mb-8">
        Sign in to continue your fitness journey.
      </p>

      <form className="space-y-5">

       <Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
/>

        <Input
  label="Password"
  type="password"
  placeholder="Enter your password"
/>

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

       <Button>
             Continue
       </Button>

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

   </motion.div>
  );
}

export default LoginCard;