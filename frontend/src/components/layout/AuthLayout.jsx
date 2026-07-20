import { motion } from "framer-motion";
import Varma from "../varma/Varma";
function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">

    <motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  }}
  className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-20 py-10"
>

        <motion.h1
            variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 },
            }}
           className="text-5xl font-heading font-bold text-primary mb-6"
>
          FitIQ
        </motion.h1>

       <motion.h2
  variants={{
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  }}
  className="text-4xl font-heading font-semibold mb-4"
>
          Hello, I'm VARMA 👋
        </motion.h2>

       <motion.p
  variants={{
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  }}
  className="text-lg text-textSecondary leading-8 max-w-lg"
>
          Your personal AI fitness companion.
        </motion.p>

        <motion.p
  variants={{
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  }}
  className="mt-6 text-textSecondary italic"
>
  Every healthier tomorrow starts with one smart decision today.
</motion.p>
        <Varma />
        
      </motion.div>

      <div className="w-full lg:w-1/2 flex justify-center items-center px-6 pb-10">

        {children}

      </div>

    </div>
  );
}

export default AuthLayout;