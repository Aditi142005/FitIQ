import { motion } from "framer-motion";
function SpeechBubble() {
  return (
    <motion.div
  initial={{ opacity: 0, scale: 0.8, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{
    delay: 0.6,
    type: "spring",
    stiffness: 120
  }}
  className="mt-6 bg-surface rounded-2xl shadow-card px-6 py-4 max-w-xs"
>
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-surface rotate-45"></div>
      <p className="text-textPrimary font-medium text-center">
        Ready to start your fitness journey? 💪
      </p>

      <p className="text-textSecondary text-sm text-center mt-2">
        I'll help you build a healthier lifestyle.
      </p>

    </motion.div>
  );
}

export default SpeechBubble;