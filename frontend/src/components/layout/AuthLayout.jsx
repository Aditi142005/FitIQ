import { motion } from "framer-motion";

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F8F1E9] flex flex-col lg:flex-row">

      {/* =========================================================
          LEFT SIDE
      ========================================================= */}
      <div className="w-full lg:w-1/2 relative overflow-hidden">

        {/* Background glow */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            absolute
            -top-40
            -left-40
            w-[450px]
            h-[450px]
            rounded-full
            bg-[#C65D3B]/10
            blur-3xl
          "
        />

        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            absolute
            bottom-[-150px]
            right-[-150px]
            w-[450px]
            h-[450px]
            rounded-full
            bg-[#C65D3B]/10
            blur-3xl
          "
        />


        {/* =======================================================
            CONTENT CONTAINER
        ======================================================= */}
        <div className="
          relative
          z-10
          min-h-screen
          px-8
          lg:px-10
          xl:px-14
          py-10
          flex
          flex-col
        ">

          {/* =====================================================
              LOGO
          ===================================================== */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="
              text-5xl
              font-heading
              font-bold
              text-[#C65D3B]
            ">
              FitIQ
            </h1>

            <div className="
              w-12
              h-1
              bg-[#C65D3B]
              rounded-full
              mt-2
            " />
          </motion.div>


          {/* =====================================================
              HERO TEXT
          ===================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.15,
            }}
            className="mt-8"
          >

            <h2 className="
              text-4xl
              xl:text-5xl
              font-heading
              font-bold
              text-[#3E302A]
              leading-[1.08]
            ">
              Your data.
              <br />

              Your progress.
              <br />

              <span className="text-[#C65D3B]">
                Your next step.
              </span>
            </h2>

            <p className="
              mt-5
              text-base
              xl:text-lg
              text-[#75665E]
              leading-7
              max-w-lg
            ">
              Turn your fitness data into meaningful insights,
              track your progress, and discover personalized
              recommendations for your next step.
            </p>

          </motion.div>


          {/* =====================================================
              WELLNESS ANIMATION AREA
              THIS HAS ITS OWN SPACE
          ===================================================== */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.35,
            }}
            className="
              mt-7
              grid
              grid-cols-3
              gap-3
              w-full
            "
          >

            {/* ===================================================
                RUNNING
            =================================================== */}
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                relative
                h-[120px]
                rounded-2xl
                bg-[#C65D3B]/8
                border
                border-[#C65D3B]/10
                overflow-hidden
              "
            >

              <div className="
                absolute
                top-3
                left-4
                text-[10px]
                font-semibold
                text-[#C65D3B]
              ">
                ACTIVITY
              </div>

              {/* Sun */}
              <div className="
                absolute
                top-7
                right-4
                w-6
                h-6
                rounded-full
                bg-[#E9A06E]/50
              " />

              {/* Ground */}
              <div className="
                absolute
                bottom-6
                left-3
                right-3
                h-[2px]
                bg-[#C65D3B]/20
              " />

              {/* Runner */}
              <div className="
                absolute
                bottom-7
                left-1/2
                -translate-x-1/2
              ">

                {/* Head */}
                <div className="
                  w-4
                  h-4
                  rounded-full
                  bg-[#C65D3B]
                  ml-4
                " />

                {/* Body */}
                <div className="
                  w-3
                  h-8
                  bg-[#C65D3B]
                  rounded-full
                  ml-5
                  mt-1
                " />

                {/* Arms */}
                <motion.div
                  animate={{
                    rotate: [20, -15, 20],
                  }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                  }}
                  className="
                    absolute
                    top-6
                    left-4
                    w-7
                    h-1.5
                    bg-[#C65D3B]
                    rounded-full
                    origin-left
                  "
                />

                {/* Legs */}
                <motion.div
                  animate={{
                    rotate: [25, -20, 25],
                  }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                  }}
                  className="
                    absolute
                    top-12
                    left-5
                    w-7
                    h-1.5
                    bg-[#3E302A]
                    rounded-full
                    origin-left
                  "
                />

                <motion.div
                  animate={{
                    rotate: [-25, 20, -25],
                  }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                  }}
                  className="
                    absolute
                    top-12
                    left-5
                    w-7
                    h-1.5
                    bg-[#3E302A]/70
                    rounded-full
                    origin-left
                  "
                />

              </div>

              <div className="
                absolute
                bottom-2
                left-3
                text-[9px]
                text-[#8B7A71]
              ">
                Move
              </div>

            </motion.div>


            {/* ===================================================
                NUTRITION
            =================================================== */}
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                delay: 0.7,
                ease: "easeInOut",
              }}
              className="
                relative
                h-[120px]
                rounded-2xl
                bg-[#C65D3B]/8
                border
                border-[#C65D3B]/10
                overflow-hidden
              "
            >

              <div className="
                absolute
                top-3
                left-4
                text-[10px]
                font-semibold
                text-[#C65D3B]
              ">
                NUTRITION
              </div>

              {/* Plate */}
              <div className="
                absolute
                bottom-6
                left-1/2
                -translate-x-1/2
                w-20
                h-7
                rounded-full
                bg-white
                border-2
                border-[#C65D3B]/20
              " />

              {/* Food */}
              <div className="
                absolute
                bottom-10
                left-1/2
                -translate-x-1/2
                w-12
                h-5
                rounded-full
                bg-[#8D9A62]/70
              " />

              <div className="
                absolute
                bottom-11
                left-[42%]
                w-3
                h-3
                rounded-full
                bg-[#C65D3B]/70
              " />

              <div className="
                absolute
                bottom-11
                left-[55%]
                w-3
                h-3
                rounded-full
                bg-[#E9A06E]
              " />

              {/* Bottle */}
              <div className="
                absolute
                bottom-6
                right-4
                w-5
                h-11
                rounded-lg
                border-2
                border-[#C65D3B]/25
                bg-[#C65D3B]/10
              " />

              <div className="
                absolute
                bottom-[48px]
                right-[19px]
                w-2
                h-2
                bg-[#C65D3B]/30
                rounded-t-sm
              " />

              <div className="
                absolute
                bottom-2
                left-3
                text-[9px]
                text-[#8B7A71]
              ">
                Fuel
              </div>

            </motion.div>


            {/* ===================================================
                SLEEP
            =================================================== */}
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                delay: 1.4,
                ease: "easeInOut",
              }}
              className="
                relative
                h-[120px]
                rounded-2xl
                bg-[#C65D3B]/8
                border
                border-[#C65D3B]/10
                overflow-hidden
              "
            >

              <div className="
                absolute
                top-3
                left-4
                text-[10px]
                font-semibold
                text-[#C65D3B]
              ">
                RECOVERY
              </div>

              {/* Moon */}
              <div className="
                absolute
                top-6
                right-5
                w-8
                h-8
                rounded-full
                bg-[#D5B7A5]
              " />

              <div className="
                absolute
                top-5
                right-3
                w-8
                h-8
                rounded-full
                bg-[#F4EAE1]
              " />

              {/* Bed */}
              <div className="
                absolute
                bottom-7
                left-4
                w-28
                h-7
                bg-white
                rounded-t-xl
                border
                border-[#C65D3B]/10
                shadow-sm
              " />

              {/* Pillow */}
              <div className="
                absolute
                bottom-10
                left-7
                w-7
                h-4
                bg-[#E9D8CA]
                rounded-lg
              " />

              {/* Sleeping person */}
              <div className="
                absolute
                bottom-10
                left-14
                w-9
                h-4
                bg-[#C65D3B]/20
                rounded-full
              " />

              {/* ZZZ */}
              <motion.span
                animate={{
                  y: [0, -5, -10],
                  opacity: [0.3, 0.8, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                }}
                className="
                  absolute
                  top-5
                  left-8
                  text-xs
                  font-bold
                  text-[#C65D3B]/50
                "
              >
                Z z Z
              </motion.span>

              <div className="
                absolute
                bottom-2
                left-3
                text-[9px]
                text-[#8B7A71]
              ">
                Rest
              </div>

            </motion.div>

          </motion.div>


          {/* =====================================================
              ANALYTICS ROW
          ===================================================== */}
          <div className="
            mt-5
            grid
            grid-cols-1
            sm:grid-cols-[1fr_210px]
            gap-4
            items-stretch
          ">

            {/* ===================================================
                FEATURE CARDS
            =================================================== */}
            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.7,
              }}
              className="
                grid
                grid-cols-3
                gap-2
              "
            >

              {/* Fitness */}
              <motion.div
                whileHover={{
                  y: -4,
                }}
                className="
                  bg-white/90
                  rounded-2xl
                  border
                  border-[#C65D3B]/10
                  p-3
                  shadow-md
                "
              >
                <div className="
                  w-8
                  h-8
                  rounded-lg
                  bg-[#C65D3B]/10
                  flex
                  items-center
                  justify-center
                  mb-2
                ">
                  📊
                </div>

                <p className="
                  text-xs
                  font-bold
                  text-[#3E302A]
                ">
                  Fitness
                </p>

                <p className="
                  text-[10px]
                  text-[#8B7A71]
                  mt-1
                ">
                  Score
                </p>
              </motion.div>


              {/* Activity */}
              <motion.div
                whileHover={{
                  y: -4,
                }}
                className="
                  bg-white/90
                  rounded-2xl
                  border
                  border-[#C65D3B]/10
                  p-3
                  shadow-md
                "
              >
                <div className="
                  w-8
                  h-8
                  rounded-lg
                  bg-[#C65D3B]/10
                  flex
                  items-center
                  justify-center
                  mb-2
                ">
                  🏃
                </div>

                <p className="
                  text-xs
                  font-bold
                  text-[#3E302A]
                ">
                  Activity
                </p>

                <p className="
                  text-[10px]
                  text-[#8B7A71]
                  mt-1
                ">
                  Insights
                </p>
              </motion.div>


              {/* Nutrition */}
              <motion.div
                whileHover={{
                  y: -4,
                }}
                className="
                  bg-white/90
                  rounded-2xl
                  border
                  border-[#C65D3B]/10
                  p-3
                  shadow-md
                "
              >
                <div className="
                  w-8
                  h-8
                  rounded-lg
                  bg-[#C65D3B]/10
                  flex
                  items-center
                  justify-center
                  mb-2
                ">
                  🥗
                </div>

                <p className="
                  text-xs
                  font-bold
                  text-[#3E302A]
                ">
                  Nutrition
                </p>

                <p className="
                  text-[10px]
                  text-[#8B7A71]
                  mt-1
                ">
                  Guidance
                </p>
              </motion.div>

            </motion.div>


            {/* ===================================================
                WEEKLY PROGRESS
            =================================================== */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.6,
                delay: 0.8,
              }}
              className="
                bg-white/95
                rounded-2xl
                border
                border-[#C65D3B]/10
                p-4
                shadow-lg
              "
            >

              <div className="
                flex
                items-center
                justify-between
                mb-3
              ">

                <div>
                  <p className="
                    text-[10px]
                    text-[#8B7A71]
                  ">
                    Weekly Progress
                  </p>

                  <p className="
                    text-xl
                    font-bold
                    text-[#3E302A]
                  ">
                    78%
                  </p>
                </div>

                <motion.div
                  animate={{
                    rotate: [0, 8, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                  }}
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-[#C65D3B]/10
                    flex
                    items-center
                    justify-center
                    text-[#C65D3B]
                    text-sm
                  "
                >
                  ↗
                </motion.div>

              </div>


              {/* Chart */}
              <div className="
                flex
                items-end
                gap-1
                h-10
              ">
                {[35, 48, 42, 58, 52, 72, 86].map(
                  (height, index) => (
                    <motion.div
                      key={index}
                      initial={{
                        height: 0,
                      }}
                      animate={{
                        height: height + "%",
                      }}
                      transition={{
                        duration: 0.6,
                        delay: 1 + index * 0.07,
                      }}
                      className="
                        flex-1
                        bg-[#C65D3B]
                        rounded-t-sm
                        opacity-80
                      "
                    />
                  )
                )}
              </div>

              <div className="
                flex
                justify-between
                mt-2
                text-[8px]
                text-[#9A8A82]
              ">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>

            </motion.div>

          </div>


          {/* =====================================================
              MESSAGE
          ===================================================== */}
          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.6,
              delay: 1,
            }}
            className="
              mt-5
              text-xs
              text-[#8B7A71]
              italic
            "
          >
            Small insights today can lead to better progress tomorrow.
          </motion.p>


          {/* =====================================================
              WAVES
          ===================================================== */}
          <div className="
            absolute
            bottom-0
            left-0
            w-full
            h-20
            overflow-hidden
            pointer-events-none
          ">

            <motion.svg
              viewBox="0 0 1200 150"
              preserveAspectRatio="none"
              className="
                absolute
                bottom-0
                left-0
                w-[130%]
                h-full
              "
              animate={{
                x: [0, -50, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >

              <path
                d="
                  M0 90
                  C180 20 300 150 500 70
                  C700 0 850 130 1030 55
                  C1120 20 1200 45 1300 15
                  L1300 150
                  L0 150
                  Z
                "
                fill="#C65D3B"
                opacity="0.12"
              />

              <path
                d="
                  M0 115
                  C180 45 320 170 520 90
                  C720 20 850 150 1040 75
                  C1150 35 1230 60 1300 30
                  L1300 150
                  L0 150
                  Z
                "
                fill="#C65D3B"
                opacity="0.08"
              />

            </motion.svg>

          </div>

        </div>

      </div>


      {/* =========================================================
          RIGHT SIDE
      ========================================================= */}
      <div className="
        w-full
        lg:w-1/2
        min-h-screen
        flex
        justify-center
        items-center
        px-6
        py-10
        bg-[#F2E9DF]
      ">
        {children}
      </div>

    </div>
  );
}

export default AuthLayout;
