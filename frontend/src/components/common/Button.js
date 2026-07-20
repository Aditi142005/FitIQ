import { motion } from "framer-motion";
function Button({ children }) {
  return (
    <motion.button
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  className="
    w-full
    bg-primary
    hover:bg-orange-700
    text-white
    rounded-xl
    py-3
    font-semibold
    shadow-lg
    hover:shadow-xl
    transition-all
    duration-300
  "
>
  {children}
</motion.button>
  );
}

export default Button;