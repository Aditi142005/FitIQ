import SpeechBubble from "./SpeechBubble";
import { motion } from "framer-motion";
function Varma() {
  return (
    <div className="mt-10 flex flex-col items-center">

      <motion.div
  initial={{ opacity: 0, y: 80 }}
  animate={{
    opacity: 1,
    y: [0, -10, 0]
  }}
  transition={{
    opacity: {
      duration: 0.5
    },
    y: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }}
  className="text-8xl"
>
  👦
</motion.div>

      <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.6 }}
>
  <SpeechBubble />
</motion.div>

    </div>
  );
}

export default Varma;