import { motion } from "framer-motion";

function Button({ 
  children, 
  type = "submit", 
  onClick, 
  disabled = false, 
  variant = "primary", 
  className = "" 
}) {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`
        w-full
        ${isPrimary 
          ? "bg-primary hover:bg-[#B34E2D] text-white shadow-lg hover:shadow-xl" 
          : "bg-white hover:bg-orange-50 text-primary border-2 border-primary/30 hover:border-primary shadow-sm"
        }
        rounded-xl
        py-3
        px-4
        font-semibold
        transition-all
        duration-200
        disabled:opacity-60
        disabled:cursor-not-allowed
        flex
        items-center
        justify-center
        gap-2
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

export default Button;